import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

function loadEnv(): void {
  let dir = process.cwd();

  while (true) {
    const file = path.join(dir, ".env");

    if (fs.existsSync(file)) {
      config({ path: file });
      return;
    }

    const parent = path.dirname(dir);

    if (parent === dir) break;

    dir = parent;
  }

  config();
}

loadEnv();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Re-export query helpers so API consumers use the same Drizzle module
// instance as the schema types exposed by this workspace package.
export {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";

export * from "./schema/index.js";