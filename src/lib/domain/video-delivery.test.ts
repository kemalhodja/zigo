import { describe, expect, it } from "vitest";

import {
  estimateMonthlyEgressCost,
  getHlsUrl,
  getMediaPlaybackUrl,
  getVideoPlaybackUrl,
  getVideoSources,
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

  it("provides prioritized adaptive HLS and MP4 fallback sources for Cloudflare Stream", () => {
    const sources = getVideoSources("cf:vid999");
    expect(sources).toHaveLength(2);
    expect(sources[0].src).toBe("https://cloudflarestream.com/vid999/manifest/video.m3u8");
    expect(sources[0].type).toBe("application/x-mpegURL");
    expect(sources[1].src).toBe("https://cloudflarestream.com/vid999/downloads/default.mp4");
    expect(sources[1].type).toBe("video/mp4");
  });

  it("provides prioritized adaptive HLS and MP4 fallback sources for Mux", () => {
    const sources = getVideoSources("mux:playback123");
    expect(sources).toHaveLength(2);
    expect(sources[0].src).toBe("https://stream.mux.com/playback123.m3u8");
    expect(sources[0].type).toBe("application/x-mpegURL");
    expect(sources[1].src).toBe("https://stream.mux.com/playback123/high.mp4");
    expect(sources[1].type).toBe("video/mp4");
  });
});
