import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

interface LinkPreviewData {
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}

// In-memory cache to prevent repeated external fetches
const previewCache = new Map<string, { data: LinkPreviewData; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function isPrivateIpOrLocalhost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("127.") ||
    normalized.startsWith("169.254.") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc00:") ||
    normalized.startsWith("fd00:") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }
  // Check private IPv4 ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x, 100.64-127.x.x)
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(normalized)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(normalized)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(normalized)) return true;
  return false;
}

function extractMetaTag(html: string, property: string): string | null {
  // Matches property="og:title" content="..." or name="description" content="..."
  const regex1 = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  const match1 = regex1.exec(html);
  if (match1?.[1]) return match1[1].trim();

  // Matches content="..." property="og:title"
  const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i");
  const match2 = regex2.exec(html);
  if (match2?.[1]) return match2[1].trim();

  return null;
}

function extractTitle(html: string): string | null {
  const ogTitle = extractMetaTag(html, "og:title") || extractMetaTag(html, "twitter:title");
  if (ogTitle) return ogTitle;
  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return titleMatch?.[1]?.trim() || null;
}

function extractDescription(html: string): string | null {
  return (
    extractMetaTag(html, "og:description") ||
    extractMetaTag(html, "twitter:description") ||
    extractMetaTag(html, "description")
  );
}

function extractImage(html: string, baseUrl: string): string | null {
  const ogImage = extractMetaTag(html, "og:image") || extractMetaTag(html, "twitter:image");
  if (!ogImage) return null;
  try {
    return new URL(ogImage, baseUrl).toString();
  } catch {
    return ogImage;
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimitAsync(`link-preview:${profile.id}`, 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Çok fazla bağlantı önizleme isteği gönderildi." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url")?.trim();

    if (!targetUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
    }

    if (isPrivateIpOrLocalhost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Access to private addresses is prohibited" }, { status: 403 });
    }

    const cacheKey = parsedUrl.toString();
    const cached = previewCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      redirect: "error",
      headers: {
        "User-Agent": "ZigoBot/1.0 (+https://www.zigo.com.tr; link-preview)",
        Accept: "text/html,application/xhtml+xml",
      },
    }).catch(() => null);

    clearTimeout(timeout);

    if (!res || !res.ok) {
      const fallback: LinkPreviewData = {
        url: parsedUrl.toString(),
        domain: parsedUrl.hostname.replace(/^www\./, ""),
        title: null,
        description: null,
        image: null,
        siteName: null,
        favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
      };
      return NextResponse.json(fallback);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      const nonHtmlFallback: LinkPreviewData = {
        url: parsedUrl.toString(),
        domain: parsedUrl.hostname.replace(/^www\./, ""),
        title: null,
        description: null,
        image: null,
        siteName: null,
        favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
      };
      return NextResponse.json(nonHtmlFallback);
    }

    const html = await res.text();
    const truncatedHtml = html.slice(0, 150_000); // Only inspect first 150KB

    const domain = parsedUrl.hostname.replace(/^www\./, "");
    const title = extractTitle(truncatedHtml);
    const description = extractDescription(truncatedHtml);
    const image = extractImage(truncatedHtml, parsedUrl.toString());
    const siteName = extractMetaTag(truncatedHtml, "og:site_name") || domain;
    const favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`;

    const data: LinkPreviewData = {
      url: parsedUrl.toString(),
      domain,
      title: title ? title.slice(0, 120) : null,
      description: description ? description.slice(0, 200) : null,
      image,
      siteName,
      favicon,
    };

    previewCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[link-preview-error]", error);
    return NextResponse.json({ error: "Preview fetch failed" }, { status: 500 });
  }
}
