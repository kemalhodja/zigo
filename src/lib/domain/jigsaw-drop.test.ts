import { describe, expect, it } from "vitest";

import {
  boardSizeForLevel,
  canPlace,
  canPlaceAnywhere,
  emptyBoard,
  type Fragment,
  generateFragment,
  isGameOver,
  paletteSizeForLevel,
  placeFragment,
  resolveClears,
} from "@/lib/domain/jigsaw-drop";

describe("board growth", () => {
  it("scales 8→9→10→11 and caps at 11", () => {
    expect(boardSizeForLevel(1)).toBe(8);
    expect(boardSizeForLevel(2)).toBe(9);
    expect(boardSizeForLevel(3)).toBe(10);
    expect(boardSizeForLevel(4)).toBe(11);
    expect(boardSizeForLevel(9)).toBe(11);
  });

  it("grows the color palette gradually and caps it", () => {
    expect(paletteSizeForLevel(1)).toBe(4);
    expect(paletteSizeForLevel(5)).toBe(6);
    expect(paletteSizeForLevel(20)).toBe(7);
  });
});

describe("generateFragment", () => {
  it("creates large connected fragments of 3-6 cells", () => {
    for (let i = 0; i < 30; i++) {
      const f = generateFragment(5);
      expect(f.cells.length).toBeGreaterThanOrEqual(3);
      expect(f.cells.length).toBeLessThanOrEqual(6);
    }
  });

  it("normalizes offsets so bounding box starts at 0,0", () => {
    const f = generateFragment(4, () => 0.99);
    expect(Math.min(...f.cells.map((p) => p.r))).toBe(0);
    expect(Math.min(...f.cells.map((p) => p.c))).toBe(0);
  });
});

function makeFragment(offsets: Array<[number, number]>, color = 0): Fragment {
  return { id: 999, cells: offsets.map(([r, c]) => ({ r, c, color })) };
}

describe("placement + clears", () => {
  it("rejects out-of-bounds and occupied anchors", () => {
    const board = emptyBoard(8);
    const f = makeFragment([
      [0, 0],
      [0, 1],
    ]);
    expect(canPlace(board, f, 0, 7)).toBe(false); // overflows right
    const placed = placeFragment(board, f, 0, 0);
    expect(canPlace(placed, f, 0, 1)).toBe(false); // overlap
    expect(canPlace(placed, f, 0, 2)).toBe(true);
  });

  it("clears a full row and scores it", () => {
    let board = emptyBoard(8);
    const one = makeFragment([[0, 0]]);
    for (let c = 0; c < 8; c++) board = placeFragment(board, one, 3, c);
    const result = resolveClears(board, 0);
    expect(result.clearedRows).toEqual([3]);
    expect(result.gainedPoints).toBeGreaterThan(0);
    expect(result.board.cells.every((cell) => cell === null || true)).toBe(true);
    // row 3 emptied
    for (let c = 0; c < 8; c++) {
      expect(result.board.cells[3 * 8 + c]).toBeNull();
    }
  });

  it("pops uniform 2×2 squares for bonus", () => {
    let board = emptyBoard(8);
    const red = makeFragment(
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
      2,
    );
    board = placeFragment(board, red, 0, 0);
    const result = resolveClears(board, 0);
    expect(result.clearedSquares).toBe(1);
    expect(result.board.cells[0]).toBeNull();
  });

  it("detects game over when no fragment fits", () => {
    let board = emptyBoard(8);
    const single = makeFragment([[0, 0]]);
    // fill everything except one cell
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (!(r === 7 && c === 7)) board = placeFragment(board, single, r, c);
      }
    }
    expect(isGameOver(board, [single])).toBe(false);
    board = placeFragment(board, single, 7, 7);
    expect(isGameOver(board, [single])).toBe(true);
    expect(canPlaceAnywhere(board, makeFragment([[0, 0], [0, 1]]))).toBe(false);
  });

  it("combo multiplier increases square pop points", () => {
    let board = emptyBoard(8);
    const red = makeFragment([[0, 0], [0, 1], [1, 0], [1, 1]], 2);
    board = placeFragment(board, red, 0, 0);
    const base = resolveClears(board, 0);
    const comboed = resolveClears(board, 2);
    expect(comboed.gainedPoints).toBeGreaterThan(base.gainedPoints);
  });
});
