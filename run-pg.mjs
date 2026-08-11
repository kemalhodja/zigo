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
    "092_fix_social_post_matches_current_user.sql"
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
