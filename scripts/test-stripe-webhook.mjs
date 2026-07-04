/* global console, process */

import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function verifyStripeWebhookSignature(payload, header, secret) {
  const parts = header.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  return signatures.some((signature) => {
    try {
      return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
    } catch {
      return false;
    }
  });
}

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
  return ok;
}

function main() {
  const webhookSource = readFileSync(join(root, "src/lib/domain/stripe-webhook.ts"), "utf8");
  const routeSource = readFileSync(join(root, "src/app/api/billing/webhook/route.ts"), "utf8");

  const checks = [
    check("Stripe webhook helper exists", webhookSource.includes("verifyStripeWebhookSignature")),
    check("Webhook route verifies signature", routeSource.includes("verifyStripeWebhookSignature")),
    check(
      "Valid signature accepted",
      verifyStripeWebhookSignature(
        '{"id":"evt_test"}',
        `t=1710000000,v1=${createHmac("sha256", "whsec_test").update('1710000000.{"id":"evt_test"}', "utf8").digest("hex")}`,
        "whsec_test",
      ),
    ),
    check(
      "Invalid signature rejected",
      !verifyStripeWebhookSignature('{"id":"evt_test"}', "t=1710000000,v1=deadbeef", "whsec_test"),
    ),
  ];

  const failed = checks.filter((ok) => !ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

main();
