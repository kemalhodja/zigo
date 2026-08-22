const { Client } = require("pg");
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required (postgres connection string)");
  process.exit(1);
}
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(() => {
  return client.query(`
    alter table public.learning_events drop constraint if exists learning_events_points_awarded_check;
    alter table public.learning_events add constraint learning_events_points_awarded_check check (points_awarded >= 0);
    delete from public.user_interests where user_id = (select id from public.users where email = 'aylin.teacher@zigo.test') and area_id = 7;
  `);
}).then(() => {
  console.log("DB updated!");
  client.end();
}).catch(console.error);
