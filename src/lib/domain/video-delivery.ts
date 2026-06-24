/**
 * Video delivery helpers. MVP uses direct Supabase Storage URLs;
 * production can front with CDN (Cloudflare/Mux) via NEXT_PUBLIC_VIDEO_CDN_BASE.
 */

export function getVideoPlaybackUrl(storagePath: string) {
  const cdnBase = process.env.NEXT_PUBLIC_VIDEO_CDN_BASE?.trim().replace(/\/$/, "");
  if (cdnBase) {
    return `${cdnBase}/${storagePath.replace(/^\//, "")}`;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!supabaseUrl || !storagePath) return storagePath;

  const normalized = storagePath.replace(/^\//, "");
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return `${supabaseUrl}/storage/v1/object/public/social-media/${normalized}`;
}

export function isAdaptiveStreamingEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_VIDEO_HLS_ENABLED === "true");
}

/** Alias for images and video paths stored in social-media bucket. */
export function getMediaPlaybackUrl(storagePath: string) {
  return getVideoPlaybackUrl(storagePath);
}
