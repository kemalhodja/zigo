import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const root = process.cwd();

// Load environment variables from .env.vercel.production
function loadEnv() {
  const filePath = join(root, ".env.vercel.production");
  const env = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }
  return env;
}

const env = loadEnv();
const rawConnectionString = env.POSTGRES_URL_NON_POOLING;

if (!rawConnectionString) {
  console.error("Error: POSTGRES_URL_NON_POOLING is not defined in .env.vercel.production");
  process.exit(1);
}

// Strip query parameters to avoid client configuration conflicts
const connectionString = rawConnectionString.split("?")[0];

const migrationPath = join(root, "supabase", "migrations", "069_google_play_billing.sql");
const sql = readFileSync(migrationPath, "utf8");

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log("Connecting to production PostgreSQL database...");
    await client.connect();
    console.log("Connected. Applying 069_google_play_billing.sql...");
    await client.query(sql);
    console.log("PASS Migration 069 successfully applied to production.");
  } catch (error) {
    console.error("FAIL Migration application failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
