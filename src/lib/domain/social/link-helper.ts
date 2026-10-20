/**
 * link-helper.ts
 *
 * Utility helpers to parse and classify external links shared on Zigo
 * (YouTube, Instagram, and general educational websites).
 */

export type ExternalLinkType = "youtube" | "instagram" | "website";

export interface ParsedExternalLink {
  type: ExternalLinkType;
  originalUrl: string;
  cleanUrl: string;
  displayDomain: string;
  label: string;
  youtubeId?: string;
  youtubeEmbedUrl?: string;
  youtubeThumbnailUrl?: string;
  isInstagramReel?: boolean;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  try {
    const raw = url.trim();
    // Shortened youtu.be format
    const shortMatch = raw.match(/(?:youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);
    if (shortMatch && shortMatch[1]) {
      return shortMatch[1];
    }

    // Standard watch, shorts, or embed URL
    const standardMatch = raw.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/i);
    if (standardMatch && standardMatch[1]) {
      return standardMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Checks if a given URL is an Instagram post, reel or profile URL.
 */
export function isInstagramUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv|stories|[^/]+)\/?/i.test(url.trim());
}

/**
 * Normalizes and classifies an external link for rich display in the feed.
 */
export function classifyExternalLink(url?: string | null): ParsedExternalLink | null {
  if (!url || typeof url !== "string") return null;

  let trimmed = url.trim();
  if (!trimmed) return null;

  // Ensure protocol
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let domain = "";
  try {
    const parsedUrl = new URL(trimmed);
    domain = parsedUrl.hostname.replace(/^www\./i, "");
  } catch {
    domain = trimmed.replace(/^https?:\/\//i, "").split("/")[0] || trimmed;
  }

  // 1. YouTube
  const youtubeId = extractYouTubeVideoId(trimmed);
  if (youtubeId) {
    const isShorts = trimmed.includes("/shorts/");
    return {
      type: "youtube",
      originalUrl: url,
      cleanUrl: trimmed,
      displayDomain: "youtube.com",
      label: isShorts ? "YouTube Shorts" : "YouTube Videosu",
      youtubeId,
      youtubeEmbedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`,
      youtubeThumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  // 2. Instagram
  if (isInstagramUrl(trimmed)) {
    const isReel = trimmed.includes("/reel/") || trimmed.includes("/reels/");
    return {
      type: "instagram",
      originalUrl: url,
      cleanUrl: trimmed,
      displayDomain: "instagram.com",
      label: isReel ? "Instagram Reels" : "Instagram Gönderisi",
      isInstagramReel: isReel,
    };
  }

  // 3. General Website
  return {
    type: "website",
    originalUrl: url,
    cleanUrl: trimmed,
    displayDomain: domain || "Web Sitesi",
    label: domain ? `${domain}` : "Web Sitesi Bağlantısı",
  };
}
