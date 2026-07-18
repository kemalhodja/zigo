import { Client } from 'pg';
import fs from 'fs';

const client = new Client({
  connectionString: 'postgres://postgres.fuqnjxcoxopomzgbifve:ac5n3HPYxUdY00F0@aws-1-eu-central-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to DB');
  
  const files = [
    "071_class_groups_section.sql",
    "072_generic_user_verification.sql",
    "073_admin_user_controls.sql"
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
  
  await client.end();
}

run().catch(console.error);
