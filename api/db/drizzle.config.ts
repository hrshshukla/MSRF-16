import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

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

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
