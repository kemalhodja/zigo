import fs from "fs";
import { Client } from "pg";

// Reads the connection string from the environment instead of hardcoding
// credentials in source control. Set SUPABASE_DB_URL before running:
//   SUPABASE_DB_URL="postgres://..." node run-pg.mjs
const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL environment variable.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log("Connected to DB");

  const files = ["090_role_change_requests.sql"];

  for (const file of files) {
    try {
      const sql = fs.readFileSync(`supabase/migrations/${file}`, "utf8");
      await client.query(sql);
      console.log(`${file} applied successfully`);
    } catch (e) {
      console.log(`Error in ${file}:`, e.message);
    }
  }

  // Reload schema cache
  await client.query(`NOTIFY pgrst, 'reload schema'`);
  console.log("Schema cache reloaded");

  await client.end();
}

run().catch(console.error);
