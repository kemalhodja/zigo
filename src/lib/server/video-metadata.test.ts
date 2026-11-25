import { describe, expect, it } from "vitest";

import { inspectVideoHeader, parseMp4MvhdDurationSeconds } from "./video-metadata";

function buildMockMp4WithMvhd(durationSeconds: number, timescale = 1000, version: 0 | 1 = 0): Uint8Array {
  const ftyp = new Uint8Array([
    0x00, 0x00, 0x00, 0x14, // size 20
    0x66, 0x74, 0x79, 0x70, // "ftyp"
    0x69, 0x73, 0x6f, 0x6d, // "isom"
    0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d,
  ]);

  const mvhdSize = version === 0 ? 108 : 120;
  const mvhd = new Uint8Array(mvhdSize);
  const view = new DataView(mvhd.buffer);
  view.setUint32(0, mvhdSize, false);
  // "mvhd"
  mvhd[4] = 0x6d;
  mvhd[5] = 0x76;
  mvhd[6] = 0x68;
  mvhd[7] = 0x64;
  mvhd[8] = version;

  const ticks = Math.round(durationSeconds * timescale);
  if (version === 0) {
    view.setUint32(20, timescale, false);
    view.setUint32(24, ticks, false);
  } else {
    view.setUint32(28, timescale, false);
    view.setUint32(32, Math.floor(ticks / 4294967296), false);
    view.setUint32(36, ticks >>> 0, false);
  }

  const combined = new Uint8Array(ftyp.length + mvhd.length);
  combined.set(ftyp, 0);
  combined.set(mvhd, ftyp.length);
  return combined;
}

describe("video-metadata server inspector", () => {
  it("extracts exact duration from MP4 v0 mvhd box", () => {
    const buf = buildMockMp4WithMvhd(22.5, 1000, 0);
    const result = inspectVideoHeader(buf);
    expect(result.validContainer).toBe(true);
    expect(result.container).toBe("mp4");
    expect(result.durationSeconds).toBeCloseTo(22.5, 2);
  });

  it("extracts exact duration from MP4 v1 (64-bit) mvhd box", () => {
    const buf = buildMockMp4WithMvhd(48, 600, 1);
    const duration = parseMp4MvhdDurationSeconds(buf);
    expect(duration).toBeCloseTo(48, 2);
  });

  it("reads tail mvhd when moov atom is placed at the end of an MP4/MOV file", () => {
    const headOnly = new Uint8Array([
      0x00, 0x00, 0x00, 0x14,
      0x66, 0x74, 0x79, 0x70, // ftyp
      0x71, 0x74, 0x20, 0x20, // qt (iPhone MOV)
      0x00, 0x00, 0x00, 0x00,
      0x71, 0x74, 0x20, 0x20,
    ]);
    const tailWithMoov = buildMockMp4WithMvhd(29, 1000, 0).slice(20);
    const result = inspectVideoHeader(headOnly, tailWithMoov);
    expect(result.validContainer).toBe(true);
    expect(result.durationSeconds).toBeCloseTo(29, 2);
  });

  it("recognizes valid WebM EBML header", () => {
    const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81]);
    const result = inspectVideoHeader(webm);
    expect(result.validContainer).toBe(true);
    expect(result.container).toBe("webm");
  });

  it("rejects spoofed non-video files (e.g. executable or text)", () => {
    const fake = new TextEncoder().encode("MZThis is not a real video file at all!");
    const result = inspectVideoHeader(fake);
    expect(result.validContainer).toBe(false);
    expect(result.container).toBe("unknown");
  });
});
