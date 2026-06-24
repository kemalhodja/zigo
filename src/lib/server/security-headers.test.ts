import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/lib/server/security-headers";

describe("security headers", () => {
  it("includes baseline CSP directives for Supabase and reCAPTCHA", () => {
    const csp = buildContentSecurityPolicy(false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("https://www.google.com");
    expect(csp).toContain("connect-src 'self' https: wss:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("adds upgrade-insecure-requests in production", () => {
    const csp = buildContentSecurityPolicy(true);
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("returns standard hardening headers", () => {
    const headers = buildSecurityHeaders(true);
    expect(headers.some((header) => header.key === "X-Frame-Options" && header.value === "DENY")).toBe(true);
    expect(headers.some((header) => header.key === "Content-Security-Policy")).toBe(true);
  });
});
