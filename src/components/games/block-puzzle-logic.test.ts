import { describe, expect, it } from "vitest";

import { canFitAnywhere, type ShapeType } from "./block-puzzle";

function fullBoard(size = 8): string[][] {
  return Array.from({ length: size }, () => Array(size).fill("bg-blue-500"));
}

function shape(matrix: number[][]): ShapeType {
  return { matrix, color: "bg-rose-500", glowColor: "" };
}

describe("canFitAnywhere", () => {
  it("fits on empty board", () => {
    const empty = Array.from({ length: 8 }, () => Array(8).fill(""));
    expect(canFitAnywhere(shape([[1, 1], [1, 1]]), empty)).toBe(true);
  });

  it("does not fit when board is full", () => {
    expect(canFitAnywhere(shape([[1]]), fullBoard())).toBe(false);
  });

  it("finds the single gap on an otherwise full board", () => {
    const board = fullBoard();
    board[3][3] = "";
    expect(canFitAnywhere(shape([[1]]), board)).toBe(true);
    // Tek hücre boşken 2'lik yatay parça sığmaz
    expect(canFitAnywhere(shape([[1, 1]]), board)).toBe(false);
  });

  it("respects piece width when only two adjacent cells are free", () => {
    const board = fullBoard();
    board[0][6] = "";
    board[0][7] = "";
    expect(canFitAnywhere(shape([[1]]), board)).toBe(true);
    expect(canFitAnywhere(shape([[1, 1]]), board)).toBe(true);
    expect(canFitAnywhere(shape([[1, 1, 1]]), board)).toBe(false);
  });
});
