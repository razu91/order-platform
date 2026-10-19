import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

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
            error: (error as Error).message,
        });
    }
});

app.listen(port, () => {
    console.log(`Orders service is listening on port ${port}`);
});