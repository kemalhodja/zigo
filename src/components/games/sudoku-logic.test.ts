import { describe, expect, it } from "vitest";
import {
  generateSolvedBoard,
  generateSudoku,
  getConflictingCells,
  isBoardComplete,
  isValid,
  solveSudoku,
  type SudokuBoard,
} from "./sudoku-logic";

describe("Sudoku Logic", () => {
  it("should generate a complete and valid 9x9 board", () => {
    const board = generateSolvedBoard();
    expect(board.length).toBe(9);
    for (let r = 0; r < 9; r++) {
      expect(board[r].length).toBe(9);
      for (let c = 0; c < 9; c++) {
        expect(board[r][c]).toBeGreaterThanOrEqual(1);
        expect(board[r][c]).toBeLessThanOrEqual(9);
      }
    }
  });

  it("should validate row, col, and 3x3 box rule correctly", () => {
    const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    board[0][0] = 5;

    // Same row conflict
    expect(isValid(board, 0, 4, 5)).toBe(false);
    // Same col conflict
    expect(isValid(board, 4, 0, 5)).toBe(false);
    // Same 3x3 box conflict
    expect(isValid(board, 1, 1, 5)).toBe(false);
    // Valid spot in another box
    expect(isValid(board, 5, 5, 5)).toBe(true);
  });

  it("should solve a board correctly with solveSudoku", () => {
    const board: SudokuBoard = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ];

    const solved = solveSudoku(board);
    expect(solved).toBe(true);
    expect(board[0][2]).toBe(4);
    expect(board[4][4]).toBe(5);
  });

  it("should generate a puzzle with empty cells based on difficulty", () => {
    const { puzzle, solution } = generateSudoku("easy");
    let zeroes = 0;
    for (const r of puzzle) {
      for (const c of r) {
        if (c === 0) zeroes++;
      }
    }
    expect(zeroes).toBeGreaterThanOrEqual(25);
    expect(isBoardComplete(solution, solution)).toBe(true);
  });

  it("should detect duplicate conflicting numbers on board", () => {
    const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    board[0][0] = 7;
    board[0][3] = 7; // duplicate in same row

    const conflicts = getConflictingCells(board);
    expect(conflicts.has("0-0")).toBe(true);
    expect(conflicts.has("0-3")).toBe(true);
  });
});
