import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import dotenv from "dotenv";
import { Pool } from "pg";
import { createApp } from "./app.js";

dotenv.config();

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
    throw new Error("TEST_DATABASE_URL is not configured");
}

const db = new Pool({
    connectionString,
});

const app = createApp(db);

test("POST /orders creates an order in PostgreSQL", async () => {
    const response = await supertest(app)
        .post("/orders")
        .send({
            customerId: "integration-test-customer",
            totalAmount: 2500.50
        });

    assert.equal(response.status, 201);
    assert.equal(response.body.order.customer_id, "integration-test-customer");

    const result = await db.query("SELECT id, customer_id, total_amount FROM orders WHERE id = $1",
        [response.body.order.id],
    );

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].customer_id, "integration-test-customer");
    assert.equal(result.rows[0].total_amount, "2500.50");

    await db.query("DELETE FROM orders WHERE id = $1",[
        response.body.order.id,
    ])
});

test("GET /orders/:id retrieves an order from PostgreSQL", async () => {
    const inserted = await db.query(
        `INSERT INTO orders (id, customer_id, total_amount)
         VALUES (
            '123e4567-e89b-12d3-a456-426614174000',
            'integration-test-customer',
            1200.00
         )
        RETURNING id`,
    );

    try {
        const response = await supertest(app)
            .get(`/orders/${inserted.rows[0].id}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.order.customer_id, "integration-test-customer");
        assert.equal(response.body.order.total_amount, "1200.00");
    } finally {
        await db.query(
            "DELETE FROM orders WHERE id = $1",
            [inserted.rows[0].id],
        )
    }
});

test("close PostgreSQL connection pool", async () => {
    await db.end();
});