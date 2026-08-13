const { Client } = require("pg");
async function tryConnect(port) {
  const client = new Client({ connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres` });
  try {
    await client.connect();
    console.log("Connected on port " + port);
    await client.query(`
      alter table public.learning_events drop constraint if exists learning_events_points_awarded_check;
      alter table public.learning_events add constraint learning_events_points_awarded_check check (points_awarded >= 0);
      delete from public.user_interests where user_id = (select id from public.users where email = 'aylin.teacher@zigo.test') and area_id = 7;
    `);
    console.log("DB updated!");
    await client.end();
    return true;
  } catch (e) {
    return false;
  }
}
async function run() {
  for (const port of [54322, 5432, 54321, 54323, 6543]) {
    if (await tryConnect(port)) break;
  }
}
run();
