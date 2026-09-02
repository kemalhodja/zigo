export type Board = number[][]; // 4x4 matrix, 0 means empty

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type MoveResult = {
  board: Board;
  scoreGained: number;
  moved: boolean;
};

export function getEmptyCells(board: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) {
        cells.push([r, c]);
      }
    }
  }
  return cells;
}

export function spawnTile(board: Board): Board {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return board;

  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;

  const newBoard = board.map((row) => [...row]);
  newBoard[r][c] = value;
  return newBoard;
}

export function initBoard(): Board {
  let b: Board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  b = spawnTile(b);
  b = spawnTile(b);
  return b;
}

/** Slide & combine a single line to the left */
export function slideLine(line: number[]): { line: number[]; score: number; moved: boolean } {
  const nonZero = line.filter((x) => x !== 0);
  const newLine: number[] = [];
  let score = 0;
  let i = 0;

  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const merged = nonZero[i] * 2;
      newLine.push(merged);
      score += merged;
      i += 2;
    } else {
      newLine.push(nonZero[i]);
      i += 1;
    }
  }

  while (newLine.length < 4) {
    newLine.push(0);
  }

  let moved = false;
  for (let j = 0; j < 4; j++) {
    if (line[j] !== newLine[j]) {
      moved = true;
      break;
    }
  }

  return { line: newLine, score, moved };
}

export function moveBoard(board: Board, dir: Direction): MoveResult {
  let rotated: Board = board.map((r) => [...r]);
  let scoreGained = 0;
  let moved = false;

  if (dir === "LEFT") {
    for (let r = 0; r < 4; r++) {
      const res = slideLine(rotated[r]);
      rotated[r] = res.line;
      scoreGained += res.score;
      if (res.moved) moved = true;
    }
    return { board: rotated, scoreGained, moved };
  }

  if (dir === "RIGHT") {
    for (let r = 0; r < 4; r++) {
      const reversed = [...rotated[r]].reverse();
      const res = slideLine(reversed);
      rotated[r] = res.line.reverse();
      scoreGained += res.score;
      if (res.moved) moved = true;
    }
    return { board: rotated, scoreGained, moved };
  }

  if (dir === "UP") {
    for (let c = 0; c < 4; c++) {
      const col = [rotated[0][c], rotated[1][c], rotated[2][c], rotated[3][c]];
      const res = slideLine(col);
      for (let r = 0; r < 4; r++) {
        rotated[r][c] = res.line[r];
      }
      scoreGained += res.score;
      if (res.moved) moved = true;
    }
    return { board: rotated, scoreGained, moved };
  }

  if (dir === "DOWN") {
    for (let c = 0; c < 4; c++) {
      const col = [rotated[3][c], rotated[2][c], rotated[1][c], rotated[0][c]];
      const res = slideLine(col);
      const reversed = res.line.reverse();
      for (let r = 0; r < 4; r++) {
        rotated[r][c] = reversed[r];
      }
      scoreGained += res.score;
      if (res.moved) moved = true;
    }
    return { board: rotated, scoreGained, moved };
  }

  return { board, scoreGained: 0, moved: false };
}

export function hasMovesRemaining(board: Board): boolean {
  if (getEmptyCells(board).length > 0) return true;

  // Check adjacent equals
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = board[r][c];
      if (r + 1 < 4 && board[r + 1][c] === val) return true;
      if (c + 1 < 4 && board[r][c + 1] === val) return true;
    }
  }

  return false;
}

export function getMaxTile(board: Board): number {
  let max = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] > max) max = board[r][c];
    }
  }
  return max;
}
