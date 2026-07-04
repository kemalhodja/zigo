/* global console, fetch */

const BASE = "https://zigo-kohl.vercel.app";

async function test(email) {
  const response = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await response.json();
  console.log(email, response.status, JSON.stringify(body));
}

await test(`unknown-${Date.now()}@gmail.com`);
await test("platform.admin@zigo.app");
