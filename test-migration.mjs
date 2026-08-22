import { Client } from 'pg';
import fs from 'fs';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required (postgres connection string)');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const sql = fs.readFileSync('supabase/migrations/098_drop_mv_use_standard_view.sql', 'utf8');
  await client.query(sql);
  await client.query("NOTIFY pgrst, 'reload schema'");
  console.log('Migration applied and schema reloaded!');
  const res = await client.query('SELECT list_explore_social_posts(5, null)');
  console.log('Rows count:', res.rows.length);
  await client.end();
}
run().catch(console.error);
