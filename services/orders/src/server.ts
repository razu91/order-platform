import dotenv from "dotenv";
import { Pool } from "pg";
import { createApp } from "./app.js";
import {
  connectRabbitMQ,
  closeRabbitMQ,
  publishOrderCreated,
} from "./rabbitmq.js";

dotenv.config();

const port = Number(process.env.PORT ?? 3001);

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function startServer(): Promise<void> {
  await connectRabbitMQ();

  const app = createApp(db, publishOrderCreated);

  const server = app.listen(port, () => {
    console.log(`Orders service listening on port ${port}`);
  });

  async function shutdown(signal: string): Promise<void> {
    console.log(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      try {
        await db.end();
        await closeRabbitMQ();
        console.log("Orders service stopped");
        process.exitCode = 0;
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exitCode = 1;
      }
    });
  }

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

startServer().catch(async (error: unknown) => {
  console.error("Failed to start Orders service:", error);

  await db.end().catch(() => undefined);
  await closeRabbitMQ().catch(() => undefined);

  process.exitCode = 1;
});
