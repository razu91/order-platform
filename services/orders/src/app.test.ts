import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import type { Pool } from "pg";
import { createApp } from "./app.js";

test("GET /orders/:id returns 400 for an invalid UUID", async () => {
    const db = {
        query: async () => ({ rows: [] }),
    } as unknown as Pool;

    const app = createApp(db);

    const response = await request(app).get("/orders/invalid-uuid");

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Invalid order ID format");
});

test("GET /orders/:id returns 404 when the order does not exist", async () => {
    const db = {
        query: async () => ({ rows: [] }),
    } as unknown as Pool;

    const app = createApp(db);
    
    const response = await request(app).get("/orders/123e4567-e89b-12d3-a456-426614174000");

    assert.equal(response.status, 404);
    assert.equal(response.body.error, "Order not found");

});

test("GET /orders/:id returns an existing order", async () => {
    const order = {
        id: "4d48fea0-c659-4f76-975b-14d4114fbb43",
        customer_id: "customer-101",
        status: "PENDING",
        total_amount: "1499.50",
        created_at: "2024-06-01T12:00:00Z",
        updated_at: "2024-06-01T12:00:00Z"
    };

    const db = {
        query: async () => ({ rows: [order] }),
    } as unknown as Pool;
    
    const app = createApp(db);

    const response = await request(app).get(`/orders/${order.id}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.order.id, order.id);
    assert.equal(response.body.order.status, "PENDING");
    assert.equal(response.body.order.total_amount, "1499.50");
});

test("POST /orders creates an order with valid input", async () => {
    const createOrderInput = {
        id: "4d48fea0-c659-4f76-975b-14d4114fbb43",
        customer_id: "customer-101",
        status: "PENDING",
        total_amount: "1499.50",
        created_at: "2024-06-01T12:00:00Z",
        updated_at: "2024-06-01T12:00:00Z"
    };

    const db = {
        query: async () => ({ rows: [createOrderInput] }),
    } as unknown as Pool;
    
    const app = createApp(db);

    const response = await request(app)
        .post("/orders").send({
            customerId: "customer-101",
            totalAmount: 1499.50,
        });

    assert.equal(response.status, 201);
    assert.equal(response.body.message, "Order created successfully");
    assert.equal(response.body.order.customer_id, "customer-101");
    assert.equal(response.body.order.status, "PENDING");
    assert.equal(response.body.order.total_amount, "1499.50");
});

test("POST /orders rejects an empty customerId", async () => {
    const db = {
        query: async () => ({ rows: [] }),
    } as unknown as Pool;

    const app = createApp(db);

    const response = await request(app)
        .post("/orders").send({
            customerId: "",
            totalAmount: 1499.50,
        });

    assert.equal(response.status, 400);
    assert.match(response.body.error, /customerId/i);
});

test("POST /orders rejects a negative totalAmount", async () => {
    const db = {
        query: async () => ({ rows: [] }),
    } as unknown as Pool;

    const app = createApp(db);

    const response = await request(app)
        .post("/orders").send({
            customerId: "customer-101",
            totalAmount: -100,
        });

    assert.equal(response.status, 400);
    assert.match(response.body.error, /totalAmount/);
});

test("POST /orders returns 500 when the database fails", async () => {
    const db = {
        query: async () => {
            throw new Error("Database unavailable");
        },
    } as unknown as Pool;

    const app = createApp(db);

    const response = await request(app)
        .post("/orders")
        .send({
            customerId: "customer-101",
            totalAmount: 100,
        });

    assert.equal(response.status, 500);
    assert.equal(response.body.error, "Failed to create order");
});