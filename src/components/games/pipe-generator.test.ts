import { describe, expect, it } from "vitest";

import { generatePipeLevel, mulberry32 } from "./pipe-generator";
import { flowReachesTarget } from "./pipe-logic";

const PRESET_COUNT = 15;

describe("generatePipeLevel", () => {
  it("aynı tohumla deterministik üretir", () => {
    const a = generatePipeLevel(PRESET_COUNT + 5, PRESET_COUNT, mulberry32(42));
    const b = generatePipeLevel(PRESET_COUNT + 5, PRESET_COUNT, mulberry32(42));
    expect(a).toEqual(b);
  });

  it("tam kare olmayan köşe hücreleri kaynak/hedef olarak tam kare boyut ister", () => {
    const t = generatePipeLevel(PRESET_COUNT, PRESET_COUNT, mulberry32(1));
    expect(t.length).toBe(5);
    for (const row of t) expect(row.length).toBe(5);
  });

  it("her üretilen bölüm kaynaktan hedefe çözülebilir", () => {
    for (let lvl = PRESET_COUNT; lvl < PRESET_COUNT + 40; lvl++) {
      const t = generatePipeLevel(lvl, PRESET_COUNT, mulberry32(lvl * 7919));
      expect(flowReachesTarget(t)).toBe(true);
    }
  });

  it("ızgara boyutu kademelerle büyür (her 10 seviyede 1 büyür, max 9)", () => {
    const sizes = [0, 8, 16, 30].map((tier) => {
      const t = generatePipeLevel(PRESET_COUNT + tier, PRESET_COUNT, mulberry32(tier + 1));
      return t.length;
    });
    // Tier 0: 5+0=5, Tier 8: 5+0=5, Tier 16: 5+1=6, Tier 30: 5+3=8
    expect(sizes).toEqual([5, 5, 6, 8]);
  });

  it("tam olarak bir kaynak ve bir hedef içerir", () => {
    const t = generatePipeLevel(PRESET_COUNT + 3, PRESET_COUNT, mulberry32(99));
    const flat = t.flat();
    expect(flat.filter((c) => c.type === "source").length).toBe(1);
    expect(flat.filter((c) => c.type === "target").length).toBe(1);
  });

  it("çeldirici borular çözülebilirliği bozmaz", () => {
    const t = generatePipeLevel(PRESET_COUNT + 20, PRESET_COUNT, mulberry32(555));
    const pipeCount = t.flat().filter((c) => !["empty", "source", "target"].includes(c.type)).length;
    expect(pipeCount).toBeGreaterThan(10);
    expect(flowReachesTarget(t)).toBe(true);
  });
});
