/**
 * link-helper.ts
 *
 * Utility helpers to parse and classify external links shared on Zigo
 * (YouTube, Vimeo/Dailymotion/Loom/etc. long-video platforms, Instagram,
 * and general educational websites).
 *
 * Zigo does NOT host long videos; creators redirect learners to YouTube or
 * similar video platforms via external links protected by the Shared Link Gate.
 */

export type ExternalLinkType = "youtube" | "instagram" | "video" | "website";

export interface ParsedExternalLink {
  type: ExternalLinkType;
  originalUrl: string;
  cleanUrl: string;
  displayDomain: string;
  label: string;
  platformName?: string;
  youtubeId?: string;
  youtubeEmbedUrl?: string;
  youtubeThumbnailUrl?: string;
  isInstagramReel?: boolean;
}

const EXTERNAL_VIDEO_PLATFORMS: Array<{
  pattern: RegExp;
  domain: string;
  platformName: string;
  label: string;
}> = [
  {
    pattern: /(?:^|\.)vimeo\.com$/i,
    domain: "vimeo.com",
    platformName: "Vimeo",
    label: "Vimeo Videosu",
  },
  {
    pattern: /(?:^|\.)(?:dailymotion\.com|dai\.ly)$/i,
    domain: "dailymotion.com",
    platformName: "Dailymotion",
    label: "Dailymotion Videosu",
  },
  {
    pattern: /(?:^|\.)loom\.com$/i,
    domain: "loom.com",
    platformName: "Loom",
    label: "Loom Ders Videosu",
  },
  {
    pattern: /(?:^|\.)tiktok\.com$/i,
    domain: "tiktok.com",
    platformName: "TikTok",
    label: "TikTok Videosu",
  },
  {
    pattern: /(?:^|\.)twitch\.tv$/i,
    domain: "twitch.tv",
    platformName: "Twitch",
    label: "Twitch Yayını",
  },
  {
    pattern: /(?:^|\.)ted\.com$/i,
    domain: "ted.com",
    platformName: "TED",
    label: "TED Konuşması",
  },
  {
    pattern: /(?:^|\.)khanacademy\.org$/i,
    domain: "khanacademy.org",
    platformName: "Khan Academy",
    label: "Khan Academy Dersi",
  },
  {
    pattern: /(?:^|\.)udemy\.com$/i,
    domain: "udemy.com",
    platformName: "Udemy",
    label: "Udemy Ders Videosu",
  },
  {
    pattern: /(?:^|\.)eba\.gov\.tr$/i,
    domain: "eba.gov.tr",
    platformName: "EBA",
    label: "EBA Ders İçeriği",
  },
  {
    pattern: /(?:^|\.)drive\.google\.com$/i,
    domain: "drive.google.com",
    platformName: "Google Drive",
    label: "Google Drive Dersi",
  },
];

/**
 * Extracts YouTube video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  try {
    const raw = url.trim();
    // Shortened youtu.be or nocookie embed format
    const shortMatch = raw.match(/(?:youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);
    if (shortMatch && shortMatch[1]) {
      return shortMatch[1];
    }

    // Standard watch, shorts, live, or embed URL
    const standardMatch = raw.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|live\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/i);
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
 * Detects known external long-video / course platforms (Vimeo, Dailymotion, Loom, etc.).
 */
export function detectExternalVideoPlatform(hostname: string) {
  if (!hostname) return null;
  const cleanHost = hostname.toLowerCase().replace(/^www\./, "");
  return EXTERNAL_VIDEO_PLATFORMS.find((platform) => platform.pattern.test(cleanHost)) ?? null;
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

  // 1. YouTube (single video, shorts, live, or playlist/channel)
  const youtubeId = extractYouTubeVideoId(trimmed);
  if (youtubeId) {
    const isShorts = trimmed.includes("/shorts/");
    const isLive = trimmed.includes("/live/");
    return {
      type: "youtube",
      originalUrl: url,
      cleanUrl: trimmed,
      displayDomain: "youtube.com",
      platformName: "YouTube",
      label: isShorts ? "YouTube Shorts" : isLive ? "YouTube Canlı Ders" : "YouTube Videosu",
      youtubeId,
      youtubeEmbedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`,
      youtubeThumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  if (/(?:^|\.)(?:youtube\.com|youtu\.be)$/i.test(domain)) {
    const isPlaylist = /[?&]list=/i.test(trimmed) || trimmed.includes("/playlist");
    return {
      type: "youtube",
      originalUrl: url,
      cleanUrl: trimmed,
      displayDomain: "youtube.com",
      platformName: "YouTube",
      label: isPlaylist ? "YouTube Oynatma Listesi" : "YouTube Kanalı",
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
      platformName: "Instagram",
      label: isReel ? "Instagram Reels" : "Instagram Gönderisi",
      isInstagramReel: isReel,
    };
  }

  // 3. Other Long-Video & Course Platforms (Vimeo, Dailymotion, Loom, EBA, Khan Academy, etc.)
  const videoPlatform = detectExternalVideoPlatform(domain);
  if (videoPlatform) {
    return {
      type: "video",
      originalUrl: url,
      cleanUrl: trimmed,
      displayDomain: videoPlatform.domain,
      platformName: videoPlatform.platformName,
      label: videoPlatform.label,
    };
  }

  // 4. General Website
  return {
    type: "website",
    originalUrl: url,
    cleanUrl: trimmed,
    displayDomain: domain || "Web Sitesi",
    label: domain ? `${domain}` : "Web Sitesi Bağlantısı",
  };
}

/**
 * Zigo İş Kuralı:
 * Paylaşılan dış bağlantılara (YouTube videoları, Vimeo/benzeri video platformları,
 * Instagram içerikleri, web kaynakları) yalnızca Zigo Plus abonesi olan kullanıcılar tıklayabilir.
 */
export function canUserOpenSharedLink(subscription?: { isPremium?: boolean } | null): boolean {
  return Boolean(subscription?.isPremium);
}
