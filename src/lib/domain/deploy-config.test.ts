import { describe, expect, it } from "vitest";
import {
  ZIGO_CANONICAL_DOMAIN,
  ZIGO_HOSTED_FALLBACK_URL,
  isLocalSiteUrl,
  probeSiteOriginReachable,
} from "@/lib/domain/deploy-config";

describe("deploy-config origin helpers", () => {
  it("exposes known hosted fallback and canonical domain", () => {
    expect(ZIGO_HOSTED_FALLBACK_URL).toBe("https://zigo-kohl.vercel.app");
    expect(ZIGO_CANONICAL_DOMAIN).toBe("https://zigo.app");
  });

  it("treats loopback hosts as local", () => {
    expect(isLocalSiteUrl("http://localhost:3000")).toBe(true);
    expect(isLocalSiteUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalSiteUrl("https://zigo-kohl.vercel.app")).toBe(false);
  });

  it("skips reachability probe for local URLs", async () => {
    const result = await probeSiteOriginReachable("http://localhost:3000");
    expect(result.ok).toBe(true);
    expect(result.detail).toMatch(/skipped/i);
  });
});
