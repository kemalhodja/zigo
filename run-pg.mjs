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
  console.log('Connected to DB');
  
  const files = [
    "20260904_student_parent_posts_and_limits.sql"
  ];

  for (const file of files) {
    try {
      const sql = fs.readFileSync(`supabase/migrations/${file}`, 'utf8');
      await client.query(sql);
      console.log(`${file} applied successfully`);
    } catch(e) {
      console.log(`Error in ${file}:`, e.message);
    }
  }

  // Reload schema cache
  await client.query(`NOTIFY pgrst, 'reload schema'`);
  console.log('Schema cache reloaded');
  
  await client.end();
}

run().catch(console.error);
