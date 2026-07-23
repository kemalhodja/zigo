import { afterEach, describe, expect, it } from "vitest";

import {
  getAuthRedirectSiteUrl,
  getSiteUrl,
  isBrokenCustomDomainHost,
  isLocalSiteUrl,
  probeSiteOriginReachable,
  usesCanonicalDomainBypass,
  ZIGO_CANONICAL_DOMAIN,
  ZIGO_HOSTED_FALLBACK_URL,
} from "@/lib/domain/deploy-config";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalUseCanonical = process.env.ZIGO_USE_CANONICAL_DOMAIN;
const originalVercelUrl = process.env.VERCEL_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  if (originalUseCanonical === undefined) delete process.env.ZIGO_USE_CANONICAL_DOMAIN;
  else process.env.ZIGO_USE_CANONICAL_DOMAIN = originalUseCanonical;
  if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = originalVercelUrl;
});

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

  it("bypasses broken zigo.app SITE_URL to the Vercel fallback by default", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://zigo.app";
    delete process.env.ZIGO_USE_CANONICAL_DOMAIN;
    expect(isBrokenCustomDomainHost("https://zigo.app")).toBe(true);
    expect(usesCanonicalDomainBypass()).toBe(true);
    expect(getSiteUrl()).toBe(ZIGO_HOSTED_FALLBACK_URL);
  });

  it("keeps canonical domain when ZIGO_USE_CANONICAL_DOMAIN=1", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://zigo.app";
    process.env.ZIGO_USE_CANONICAL_DOMAIN = "1";
    expect(usesCanonicalDomainBypass()).toBe(false);
    expect(getSiteUrl()).toBe("https://zigo.app");
  });

  it("replaces localhost SITE_URL with request origin for auth redirects", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    delete process.env.VERCEL_URL;
    expect(getAuthRedirectSiteUrl("https://zigo-kohl.vercel.app")).toBe("https://zigo-kohl.vercel.app");
  });

  it("falls back to hosted URL when auth redirect origin is broken", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://zigo.app";
    delete process.env.ZIGO_USE_CANONICAL_DOMAIN;
    expect(getAuthRedirectSiteUrl("https://zigo.app")).toBe(ZIGO_HOSTED_FALLBACK_URL);
  });
});