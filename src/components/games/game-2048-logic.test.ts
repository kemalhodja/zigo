import { describe, expect, it } from "vitest";
import {
  type Board,
  hasMovesRemaining,
  initBoard,
  moveBoard,
  slideLine,
} from "./game-2048-logic";

describe("2048 Game Logic", () => {
  it("should initialize board with two non-zero tiles", () => {
    const board = initBoard();
    let nonZero = 0;
    for (const r of board) {
      for (const c of r) {
        if (c > 0) nonZero++;
      }
    }
    expect(nonZero).toBe(2);
  });

  it("should merge matching adjacent numbers to the left", () => {
    const line = [2, 2, 4, 8];
    const res = slideLine(line);
    expect(res.line).toEqual([4, 4, 8, 0]);
    expect(res.score).toBe(4);
    expect(res.moved).toBe(true);
  });

  it("should merge correctly with zeroes in between", () => {
    const line = [2, 0, 0, 2];
    const res = slideLine(line);
    expect(res.line).toEqual([4, 0, 0, 0]);
    expect(res.score).toBe(4);
    expect(res.moved).toBe(true);
  });

  it("should not double merge in single swipe [4, 4, 4, 4]", () => {
    const line = [4, 4, 4, 4];
    const res = slideLine(line);
    expect(res.line).toEqual([8, 8, 0, 0]);
    expect(res.score).toBe(16);
  });

  it("should slide board in all four directions", () => {
    const board: Board = [
      [2, 0, 0, 2],
      [0, 4, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const left = moveBoard(board, "LEFT");
    expect(left.board[0]).toEqual([4, 0, 0, 0]);
    expect(left.board[1]).toEqual([8, 0, 0, 0]);

    const right = moveBoard(board, "RIGHT");
    expect(right.board[0]).toEqual([0, 0, 0, 4]);
    expect(right.board[1]).toEqual([0, 0, 0, 8]);

    const down = moveBoard(board, "DOWN");
    expect(down.board[3][0]).toBe(2);
    expect(down.board[3][1]).toBe(4);
  });

  it("should correctly detect game over when board is full and no merges possible", () => {
    const fullNoMoves: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(hasMovesRemaining(fullNoMoves)).toBe(false);

    const fullWithMove: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 4], // adjacent 4s
    ];
    expect(hasMovesRemaining(fullWithMove)).toBe(true);
  });
});
