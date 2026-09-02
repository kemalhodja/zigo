export type SudokuBoard = number[][]; // 9x9, 0 is empty
export type Difficulty = "easy" | "medium" | "hard";

/** Check if placing num at board[row][col] is valid according to Sudoku rules */
export function isValid(board: SudokuBoard, row: number, col: number, num: number): boolean {
  // Check row & col
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[startRow + r][startCol + c] === num) return false;
    }
  }

  return true;
}

/** Solve Sudoku with backtracking. Mutates board in place. */
export function solveSudoku(board: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        // Try numbers 1-9 in random order for variety when generating
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const num of nums) {
          if (isValid(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudoku(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/** Count solutions up to 2 (to check uniqueness) */
function countSolutions(board: SudokuBoard, count = { value: 0 }): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, r, c, num)) {
            board[r][c] = num;
            countSolutions(board, count);
            board[r][c] = 0;
            if (count.value >= 2) return count.value;
          }
        }
        return count.value;
      }
    }
  }
  count.value += 1;
  return count.value;
}

/** Generate a complete 9x9 valid Sudoku board */
export function generateSolvedBoard(): SudokuBoard {
  const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudoku(board);
  return board;
}

export type SudokuPuzzle = {
  puzzle: SudokuBoard;
  solution: SudokuBoard;
};

/** Generate a puzzle by removing cells based on difficulty */
export function generateSudoku(difficulty: Difficulty): SudokuPuzzle {
  const solution = generateSolvedBoard();
  const puzzle = solution.map((r) => [...r]);

  // Number of cells to remove:
  // Easy: ~32-36 removed (leaves 45-49 clues)
  // Medium: ~42-46 removed (leaves 35-39 clues)
  // Hard: ~50-54 removed (leaves 27-31 clues)
  const targetRemove = difficulty === "easy" ? 34 : difficulty === "medium" ? 44 : 52;

  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  positions.sort(() => Math.random() - 0.5);

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= targetRemove) break;

    const temp = puzzle[r][c];
    puzzle[r][c] = 0;

    // Verify unique solution
    const copy = puzzle.map((row) => [...row]);
    const solCount = countSolutions(copy, { value: 0 });

    if (solCount === 1) {
      removed++;
    } else {
      puzzle[r][c] = temp; // restore if not unique
    }
  }

  return { puzzle, solution };
}

/** Check if current board is completely and correctly filled */
export function isBoardComplete(board: SudokuBoard, solution: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0 || board[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}

/** Find conflicting cells on current board */
export function getConflictingCells(board: SudokuBoard): Set<string> {
  const conflicts = new Set<string>();

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Map<number, number>();
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val !== 0) {
        if (seen.has(val)) {
          conflicts.add(`${r}-${c}`);
          conflicts.add(`${r}-${seen.get(val)}`);
        } else {
          seen.set(val, c);
        }
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Map<number, number>();
    for (let r = 0; r < 9; r++) {
      const val = board[r][c];
      if (val !== 0) {
        if (seen.has(val)) {
          conflicts.add(`${r}-${c}`);
          conflicts.add(`${seen.get(val)}-${c}`);
        } else {
          seen.set(val, r);
        }
      }
    }
  }

  // Check 3x3 boxes
  for (let boxR = 0; boxR < 3; boxR++) {
    for (let boxC = 0; boxC < 3; boxC++) {
      const seen = new Map<number, [number, number]>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = boxR * 3 + r;
          const col = boxC * 3 + c;
          const val = board[row][col];
          if (val !== 0) {
            if (seen.has(val)) {
              const [prevR, prevC] = seen.get(val)!;
              conflicts.add(`${row}-${col}`);
              conflicts.add(`${prevR}-${prevC}`);
            } else {
              seen.set(val, [row, col]);
            }
          }
        }
      }
    }
  }

  return conflicts;
}
