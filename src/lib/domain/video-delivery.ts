/**
 * Video delivery helpers. MVP uses direct Supabase Storage URLs;
 * production fronts with Bunny.net / Mux / Cloudflare via CDN envs.
 * Priority: 1) Bunny pull zone 2) Generic CDN base 3) Supabase public URL
 */

export type VideoDeliveryProvider = "supabase" | "bunny" | "mux" | "cloudflare" | "generic";

export function getVideoDeliveryProvider(): VideoDeliveryProvider {
  if (process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE) return "bunny";
  if (process.env.NEXT_PUBLIC_MUX_PLAYBACK_BASE) return "mux";
  if (process.env.NEXT_PUBLIC_CLOUDFLARE_R2_CDN) return "cloudflare";
  if (process.env.NEXT_PUBLIC_VIDEO_CDN_BASE) return "generic";
  return "supabase";
}

export function isBunnyEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE);
}

export function isMuxEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_MUX_PLAYBACK_BASE);
}

export function getVideoPlaybackUrl(storagePath: string) {
  if (!storagePath) return storagePath;
  const normalized = storagePath.replace(/^\//, "");
  if (normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("blob:") || normalized.startsWith("data:")) {
    // Already absolute: if it's a Supabase storage URL and Bunny is enabled, rewrite to Bunny pull zone
    if (isBunnyEnabled() && normalized.includes("/storage/v1/object/public/social-media/")) {
      const bunnyBase = `https://${process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE!.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
      const pathPart = normalized.split("/storage/v1/object/public/social-media/")[1] ?? normalized;
      return `${bunnyBase}/${pathPart}`;
    }
    return storagePath;
  }

  // 1) Bunny.net pull zone (en ucuz, anında aktif)
  const bunnyZone = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (bunnyZone) {
    const token = process.env.NEXT_PUBLIC_BUNNY_TOKEN_ENABLED === "true" ? generateBunnyToken(normalized) : "";
    return `https://${bunnyZone}/${normalized}${token}`;
  }

  // 2) Generic CDN base (Cloudflare R2 custom domain veya herhangi CDN)
  const cdnBase = (process.env.NEXT_PUBLIC_VIDEO_CDN_BASE || process.env.NEXT_PUBLIC_CLOUDFLARE_R2_CDN || "").trim().replace(/\/$/, "");
  if (cdnBase) {
    return `${cdnBase}/${normalized}`;
  }

  // 3) Mux playback (HLS adaptive) - path is Mux playbackId
  const muxBase = process.env.NEXT_PUBLIC_MUX_PLAYBACK_BASE?.trim().replace(/\/$/, "");
  if (muxBase && normalized.startsWith("mux:")) {
    return `${muxBase}/${normalized.replace(/^mux:/, "")}/playlist.m3u8`;
  }

  // 4) Fallback: Supabase public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!supabaseUrl) return storagePath;
  return `${supabaseUrl}/storage/v1/object/public/social-media/${normalized}`;
}

function generateBunnyToken(_path: string): string {
  // Bunny token auth: ?token=md5(tokenKey + _path + expires) - server should sign, client only appends if enabled
  // MVP: client-side unsigned (pull zone with no token). Prod: use /api/video/bunny-token
  const tokenKey = process.env.NEXT_PUBLIC_BUNNY_TOKEN_KEY?.trim();
  const expires = process.env.NEXT_PUBLIC_BUNNY_TOKEN_EXPIRES?.trim();
  if (!tokenKey || !expires) return "";
  return `?token=${tokenKey.slice(0, 8)}_${expires}`;
}

export function getHlsUrl(storagePath: string): string | null {
  if (!isAdaptiveStreamingEnabled() && !isMuxEnabled()) return null;
  const muxBase = process.env.NEXT_PUBLIC_MUX_PLAYBACK_BASE?.trim().replace(/\/$/, "");
  if (muxBase && storagePath.startsWith("mux:")) {
    return `${muxBase}/${storagePath.replace(/^mux:/, "")}/playlist.m3u8`;
  }
  // Bunny Stream HLS is also via pull zone with /playlist.m3u8
  if (isBunnyEnabled() && storagePath.endsWith(".m3u8")) {
    return getVideoPlaybackUrl(storagePath);
  }
  return null;
}

export function isAdaptiveStreamingEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_VIDEO_HLS_ENABLED === "true" || isMuxEnabled());
}

/** Alias for images and video paths stored in social-media bucket. */
export function getMediaPlaybackUrl(storagePath: string) {
  return getVideoPlaybackUrl(storagePath);
}

export function estimateMonthlyEgressCost(gbPerMonth: number, provider: VideoDeliveryProvider = getVideoDeliveryProvider()): { costTry: number; savingsTry: number } {
  // Fiyatlar Ağustos 2026: Supabase egress $0.09/GB, Bunny $0.01/GB, Cloudflare R2 $0 egress + $0.015/GB CDN, Mux $0.04/GB
  const supabasePerGbTry = 3.0; // 0.09*33
  const priceMap: Record<VideoDeliveryProvider, number> = {
    supabase: supabasePerGbTry,
    bunny: 0.33,
    mux: 1.32,
    cloudflare: 0.5,
    generic: 0.5,
  };
  const current = priceMap[provider] * gbPerMonth;
  const supabaseCost = supabasePerGbTry * gbPerMonth;
  return { costTry: Math.round(current), savingsTry: Math.round(supabaseCost - current) };
}
