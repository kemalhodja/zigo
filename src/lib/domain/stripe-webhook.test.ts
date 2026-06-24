import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyStripeWebhookSignature } from "@/lib/domain/stripe-webhook";

function buildStripeSignature(payload: string, secret: string, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

describe("stripe webhook signature", () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ type: "checkout.session.completed" });

  it("accepts valid signatures", () => {
    const header = buildStripeSignature(payload, secret);
    expect(verifyStripeWebhookSignature(payload, header, secret)).toBe(true);
  });

  it("rejects missing signature header", () => {
    expect(verifyStripeWebhookSignature(payload, null, secret)).toBe(false);
  });

  it("rejects tampered payload", () => {
    const header = buildStripeSignature(payload, secret);
    expect(verifyStripeWebhookSignature(`${payload}!`, header, secret)).toBe(false);
  });

  it("rejects expired timestamps", () => {
    const staleTimestamp = Math.floor(Date.now() / 1000) - 600;
    const header = buildStripeSignature(payload, secret, staleTimestamp);
    expect(verifyStripeWebhookSignature(payload, header, secret)).toBe(false);
  });

  it("rejects malformed signature headers", () => {
    expect(verifyStripeWebhookSignature(payload, "v1=abc", secret)).toBe(false);
  });
});
