import { describe, expect, it } from "vitest";

import {
  classifyExternalLink,
  extractYouTubeVideoId,
  isInstagramUrl,
} from "./link-helper";

describe("link-helper", () => {
  describe("extractYouTubeVideoId", () => {
    it("extracts ID from standard watch URL", () => {
      const id = extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(id).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from shortened youtu.be URL", () => {
      const id = extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?si=abcdef");
      expect(id).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from YouTube shorts URL", () => {
      const id = extractYouTubeVideoId("https://youtube.com/shorts/dQw4w9WgXcQ");
      expect(id).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from embed URL", () => {
      const id = extractYouTubeVideoId("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
      expect(id).toBe("dQw4w9WgXcQ");
    });

    it("returns null for non-YouTube URL", () => {
      expect(extractYouTubeVideoId("https://instagram.com/p/12345")).toBeNull();
      expect(extractYouTubeVideoId("https://example.com")).toBeNull();
      expect(extractYouTubeVideoId("")).toBeNull();
    });
  });

  describe("isInstagramUrl", () => {
    it("identifies Instagram reel, post and profile URLs", () => {
      expect(isInstagramUrl("https://www.instagram.com/reel/C1234567890/")).toBe(true);
      expect(isInstagramUrl("https://instagram.com/p/C1234567890")).toBe(true);
      expect(isInstagramUrl("instagram.com/reel/xyz123")).toBe(true);
    });

    it("returns false for non-Instagram URLs", () => {
      expect(isInstagramUrl("https://youtube.com")).toBe(false);
      expect(isInstagramUrl("https://example.com")).toBe(false);
    });
  });

  describe("classifyExternalLink", () => {
    it("classifies YouTube video correctly", () => {
      const res = classifyExternalLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(res).not.toBeNull();
      expect(res?.type).toBe("youtube");
      expect(res?.youtubeId).toBe("dQw4w9WgXcQ");
      expect(res?.youtubeEmbedUrl).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
      expect(res?.youtubeThumbnailUrl).toContain("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    });

    it("classifies Instagram reel correctly", () => {
      const res = classifyExternalLink("https://www.instagram.com/reel/C1234567890/");
      expect(res).not.toBeNull();
      expect(res?.type).toBe("instagram");
      expect(res?.isInstagramReel).toBe(true);
      expect(res?.label).toBe("Instagram Reels");
    });

    it("classifies general website correctly", () => {
      const res = classifyExternalLink("https://fiziknotlari.com/ders/kuvvet");
      expect(res).not.toBeNull();
      expect(res?.type).toBe("website");
      expect(res?.displayDomain).toBe("fiziknotlari.com");
      expect(res?.cleanUrl).toBe("https://fiziknotlari.com/ders/kuvvet");
    });

    it("handles URL without protocol correctly", () => {
      const res = classifyExternalLink("matematik.k12.tr");
      expect(res).not.toBeNull();
      expect(res?.cleanUrl).toBe("https://matematik.k12.tr");
    });

    it("returns null for empty or null URL", () => {
      expect(classifyExternalLink(null)).toBeNull();
      expect(classifyExternalLink("")).toBeNull();
      expect(classifyExternalLink("   ")).toBeNull();
    });
  });
});
