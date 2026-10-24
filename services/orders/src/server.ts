
import dotenv from "dotenv";
import { Pool } from "pg";
import { createApp } from "./app.js";

dotenv.config();

const port = Number(process.env.PORT ?? 3001);

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = createApp(db);

app.listen(port, () => {
  console.log(`Orders service listening on port ${port}`);
});
