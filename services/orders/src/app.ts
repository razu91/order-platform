import express from "express";
import { Pool } from "pg";
import {randomUUID} from "node:crypto";

type OrderCreatedPublisher = (order: {
    id: string;
    customer_id: string;
    status: string;
    total_amount: string | number;
    created_at: string | Date;
    updated_at: string | Date;
}) => Promise<void>;
export function createApp(
    db: Pool,
    publishOrderCreated?: OrderCreatedPublisher
) {

    const app = express();

    app.use(express.json());

    // Health check
    app.get("/health", async (req, res) => {
        try {
            await db.query("SELECT 1");

            res.json({
                status: "ok",
                service: "orders",
                database: "connected",
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                service: "orders",
                database: "disconnected",
            });
        }
    });

    // Create a new order
    app.post("/orders", async (req, res) => {
        const { customerId, totalAmount } = req.body;

        if(
            typeof customerId !== "string" ||
            customerId.trim().length === 0 ||
            customerId.length > 100 ||
            typeof totalAmount !== "number" ||
            totalAmount < 0
        ) {
            return res.status(400).json({
                error: "CustomerId and non-negative numeric totalAmount are required", 
            });
        }

        const id = randomUUID();

        try {
            const result = await db.query(
                "INSERT INTO orders (id, customer_id, total_amount) VALUES ($1, $2, $3) RETURNING id, customer_id, status, total_amount, created_at, updated_at",
                [id, customerId, totalAmount]
            );

            const order = result.rows[0];

            if (publishOrderCreated) {
                await publishOrderCreated(order);
            }

            return res.status(201).json({
                message: "Order created successfully",
                order,
            })
        } catch (error) {
            console.error("Failed to create order:", error);
            return res.status(500).json({ 
                error: "Failed to create order"
            });
        }
    });

    // Get an order by ID
    app.get("/orders/:id", async (req, res) => {
        const { id } = req.params;

        // Validate the order ID format
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if(!uuidPattern.test(id)) {
            return res.status(400).json({
                error: "Invalid order ID format"
            });
        }

        try{
            const result = await db.query(
                'SELECT  id, customer_id, status, total_amount, created_at, updated_at FROM orders WHERE id = $1',
                [id]
            );

            if(result.rows.length === 0) {
                return res.status(404).json({
                    error: "Order not found"
                })
            }

            return res.status(200).json({
                order: result.rows[0]
            });
        } catch (error) {
            console.error("Failed to retrieve order:", error);
            return res.status(500).json({
                error: "Failed to retrieve order"
            });
        }
        
    });

    return app;
    
}