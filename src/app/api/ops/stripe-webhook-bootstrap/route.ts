import { NextResponse } from "next/server";

/**
 * TEMPORARY ops bootstrap: registers the Stripe webhook endpoint via the
 * Stripe API using the server-side key, so STRIPE_WEBHOOK_SECRET can be
 * provisioned without dashboard access.
 *
 * Guarded by a shared token in ZIGO_BOOTSTRAP_TOKEN (env). This file is
 * removed immediately after the secret is captured.
 */
export async function POST(request: Request) {
  const expected = process.env.ZIGO_BOOTSTRAP_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json({ error: "Bootstrap disabled." }, { status: 404 });
  }
  if (request.headers.get("x-bootstrap-token") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key.startsWith("sk_test_mock")) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured." }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const webhookUrl = `${origin}/api/billing/webhook`;
  const events = [
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];

  try {
    // List existing endpoints and remove any duplicates pointing at this URL.
    const listRes = await fetch("https://api.stripe.com/v1/webhook_endpoints?limit=100", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!listRes.ok) {
      return NextResponse.json({ error: `Stripe list failed: ${listRes.status}` }, { status: 502 });
    }
    const listBody = await listRes.json();
    for (const ep of listBody.data ?? []) {
      if (ep.url === webhookUrl && typeof ep.id === "string") {
        await fetch(`https://api.stripe.com/v1/webhook_endpoints/${ep.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${key}` },
        });
      }
    }

    // Create the endpoint; the signing secret is returned exactly once here.
    const form = new URLSearchParams();
    form.set("url", webhookUrl);
    for (const event of events) form.append("enabled_events[]", event);
    form.set("description", "Zigo billing webhook (auto-provisioned)");

    const createRes = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const createBody = await createRes.json();
    if (!createRes.ok) {
      return NextResponse.json(
        { error: `Stripe create failed: ${createRes.status}`, detail: createBody?.error?.message },
        { status: 502 },
      );
    }

    return NextResponse.json({
      data: {
        id: createBody.id,
        url: createBody.url,
        secret: createBody.secret ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bootstrap failed." },
      { status: 500 },
    );
  }
}
