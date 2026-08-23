import { describe, expect, it } from "vitest";

import { BASE_DIRECTIONS, rotateDirections } from "./pipe-logic";

describe("rotateDirections", () => {
  it("does not rotate at 0 degrees", () => {
    expect(rotateDirections([true, false, true, false], 0)).toEqual([true, false, true, false]);
  });

  it("rotates straight pipe 90 degrees to vertical", () => {
    // Yatay boru [↑,→,↓,←] = [T,F,T,F] → 90° sonra [F,T,F,T] (dikey)
    expect(rotateDirections(BASE_DIRECTIONS.straight, 90)).toEqual([false, true, false, true]);
  });

  it("straight returns to original after full rotation", () => {
    expect(rotateDirections(BASE_DIRECTIONS.straight, 360)).toEqual(BASE_DIRECTIONS.straight);
  });

  it("corner opening changes side after rotation", () => {
    // corner [↑,→,↓,←]=[T,T,F,F]: 90° döndürünce [F,T,T,F]
    expect(rotateDirections(BASE_DIRECTIONS.corner, 90)).toEqual([false, true, true, false]);
  });

  it("handles negative-free modulo for 270 degrees", () => {
    const r90 = rotateDirections(BASE_DIRECTIONS.corner, 90);
    const r180 = rotateDirections(r90, 90);
    const r270 = rotateDirections(r180, 90);
    expect(r270).toEqual(rotateDirections(BASE_DIRECTIONS.corner, 270));
  });
});
