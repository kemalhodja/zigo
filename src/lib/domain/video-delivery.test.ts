import { describe, expect, it } from "vitest";

import {
  estimateMonthlyEgressCost,
  getHlsUrl,
  getMediaPlaybackUrl,
  getVideoPlaybackUrl,
} from "./video-delivery";

describe("Video Delivery & Adaptive Streaming Suite", () => {
  it("resolves direct Supabase storage URL when no custom CDN is set", () => {
    const rawPath = "videos/sample-lesson.mp4";
    const resolved = getVideoPlaybackUrl(rawPath);
    expect(resolved).toContain("/storage/v1/object/public/social-media/videos/sample-lesson.mp4");
  });

  it("resolves Cloudflare Stream HLS manifest for cf: prefix", () => {
    const cfPath = "cf:abc123xyz789";
    const resolved = getVideoPlaybackUrl(cfPath);
    expect(resolved).toBe("https://cloudflarestream.com/abc123xyz789/manifest/video.m3u8");

    const hlsUrl = getHlsUrl(cfPath);
    expect(hlsUrl).toBe("https://cloudflarestream.com/abc123xyz789/manifest/video.m3u8");
  });

  it("preserves external absolute https URLs without mutation", () => {
    const external = "https://cdn.example.com/lessons/optik-cozum.mp4";
    const resolved = getVideoPlaybackUrl(external);
    expect(resolved).toBe(external);
  });

  it("calculates monthly egress savings correctly", () => {
    const { costTry, savingsTry } = estimateMonthlyEgressCost(1000, "bunny");
    // Supabase 1000GB * 3 = 3000 TL; Bunny 1000GB * 0.33 = 330 TL; Savings = ~2670 TL
    expect(costTry).toBe(330);
    expect(savingsTry).toBe(2670);
  });

  it("supports getMediaPlaybackUrl fallback gracefully", () => {
    const url = getMediaPlaybackUrl("avatars/user-123.jpg");
    expect(url).toContain("/storage/v1/object/public/avatars/user-123.jpg");
  });
});
