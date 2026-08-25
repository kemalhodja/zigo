/**
 * Yapboz Düşüşü (jigsaw_drop) — pure game logic.
 *
 * Difficulty scales through BOARD GROWTH: level 1 starts at 8×8 and the board
 * expands 9×9 → 10×10 → 11×11 as the player levels up (capped at 11).
 * Fragments are deliberately LARGE (3-6 cells) per design: "mümkün olan
 * maksimum kare".
 *
 * Clear rules:
 *  - any fully-occupied row or column clears
 *  - a 2×2 square of one uniform color pops for bonus points
 */

export const MIN_BOARD = 8;
export const MAX_BOARD = 11;

export type Cell = {
  color: number;
} | null;

export type Board = {
  size: number;
  cells: Cell[]; // row-major, size*size
};

export type Fragment = {
  id: number;
  /** Relative cell offsets within the fragment's bounding box. */
  cells: Array<{ r: number; c: number; color: number }>;
};

export function boardSizeForLevel(level: number): number {
  return Math.min(MIN_BOARD + Math.max(0, level - 1), MAX_BOARD);
}

export function paletteSizeForLevel(level: number): number {
  return Math.min(4 + Math.floor((level - 1) / 2), 7);
}

function idx(size: number, r: number, c: number): number {
  return r * size + c;
}

export function emptyBoard(size: number): Board {
  return { size, cells: new Array<Cell>(size * size).fill(null) };
}

let fragmentIdSeq = 1;
export function resetFragmentIds(): void {
  fragmentIdSeq = 1;
}

/**
 * Generates a large connected fragment (3..6 cells) with uniform or
 * dual-tone colors. Growth is random-walk from a seed cell so shapes stay
 * chunky ("maksimum kare") rather than snake-thin.
 */
export function generateFragment(
  colors: number,
  rng: () => number = Math.random,
): Fragment {
  const targetSize = 3 + Math.floor(rng() * 4); // 3..6
  const picked = new Map<string, { r: number; c: number; color: number }>();
  const baseColor = Math.floor(rng() * colors);
  picked.set("0,0", { r: 0, c: 0, color: baseColor });

  let guard = 0;
  while (picked.size < targetSize && guard++ < 200) {
    const existing = [...picked.values()];
    const anchor = existing[Math.floor(rng() * existing.length)];
    const dir = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ][Math.floor(rng() * 4)];
    const nr = anchor.r + dir[0];
    const nc = anchor.c + dir[1];
    if (nr < 0 || nc < 0 || nr > 2 || nc > 2) continue; // keep bounding box ≤3×3
    if (picked.has(`${nr},${nc}`)) continue;

    // Mostly uniform, sometimes an accent color — makes color-pops strategic.
    const color = rng() < 0.78 ? baseColor : Math.floor(rng() * colors);
    picked.set(`${nr},${nc}`, { r: nr, c: nc, color });
  }

  // Normalize offsets so bounding box starts at 0,0
  const minR = Math.min(...[...picked.values()].map((p) => p.r));
  const minC = Math.min(...[...picked.values()].map((p) => p.c));
  const cells = [...picked.values()].map((p) => ({
    r: p.r - minR,
    c: p.c - minC,
    color: p.color,
  }));

  return { id: fragmentIdSeq++, cells };
}

/** Checks whether the fragment fits at (row,col) as its top-left anchor. */
export function canPlace(board: Board, fragment: Fragment, row: number, col: number): boolean {
  for (const cell of fragment.cells) {
    const r = row + cell.r;
    const c = col + cell.c;
    if (r < 0 || c < 0 || r >= board.size || c >= board.size) return false;
    if (board.cells[idx(board.size, r, c)] !== null) return false;
  }
  return true;
}

export function placeFragment(
  board: Board,
  fragment: Fragment,
  row: number,
  col: number,
): Board {
  const cells = [...board.cells];
  for (const cell of fragment.cells) {
    cells[idx(board.size, row + cell.r, col + cell.c)] = { color: cell.color };
  }
  return { size: board.size, cells };
}

export type ClearResult = {
  board: Board;
  clearedRows: number[];
  clearedCols: number[];
  clearedSquares: number;
  gainedPoints: number;
};

const BASE_LINE_POINTS = 40;
const SQUARE_POINTS = 60;
const COMBO_MULTIPLIER = 1.5;

/** Applies all clear rules and scores the move. */
export function resolveClears(
  board: Board,
  comboLevel: number = 0,
  rng: () => number = Math.random,
): ClearResult {
  const size = board.size;
  const cells = [...board.cells];

  const fullRows: number[] = [];
  const fullCols: number[] = [];
  for (let r = 0; r < size; r++) {
    if (cells.slice(idx(size, r, 0), idx(size, r, 0) + size).every((c) => c !== null)) {
      fullRows.push(r);
    }
  }
  for (let c = 0; c < size; c++) {
    let full = true;
    for (let r = 0; r < size; r++) {
      if (cells[idx(size, r, c)] === null) {
        full = false;
        break;
      }
    }
    if (full) fullCols.push(c);
  }

  // Uniform 2×2 squares pop regardless of line clears.
  const squareCells = new Set<number>();
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const a = cells[idx(size, r, c)];
      const b = cells[idx(size, r, c + 1)];
      const d = cells[idx(size, r + 1, c)];
      const e = cells[idx(size, r + 1, c + 1)];
      if (a && b && d && e && a.color === b.color && b.color === d.color && d.color === e.color) {
        squareCells.add(idx(size, r, c));
        squareCells.add(idx(size, r, c + 1));
        squareCells.add(idx(size, r + 1, c));
        squareCells.add(idx(size, r + 1, c + 1));
      }
    }
  }

  const multiplier = Math.pow(COMBO_MULTIPLIER, comboLevel);
  const gainedPoints = Math.round(
    (fullRows.length + fullCols.length) * BASE_LINE_POINTS * size * 0.5 +
      (squareCells.size / 4) * SQUARE_POINTS * multiplier,
  );

  for (const r of fullRows) {
    for (let c = 0; c < size; c++) cells[idx(size, r, c)] = null;
  }
  for (const c of fullCols) {
    for (let r = 0; r < size; r++) cells[idx(size, r, c)] = null;
  }
  for (const i of squareCells) cells[i] = null;

  void rng; // reserved for future sparkle variance

  return {
    board: { size, cells },
    clearedRows: fullRows,
    clearedCols: fullCols,
    clearedSquares: squareCells.size / 4,
    gainedPoints,
  };
}

/** True when none of the remaining fragments fit anywhere on the board. */
export function isGameOver(board: Board, fragments: Fragment[]): boolean {
  return !fragments.some((f) => canPlaceAnywhere(board, f));
}

export function canPlaceAnywhere(board: Board, fragment: Fragment): boolean {
  for (let r = 0; r <= board.size - maxRowExtent(fragment); r++) {
    for (let c = 0; c <= board.size - maxColExtent(fragment); c++) {
      if (canPlace(board, fragment, r, c)) return true;
    }
  }
  return false;
}

function maxRowExtent(fragment: Fragment): number {
  return Math.max(...fragment.cells.map((p) => p.r)) + 1;
}
function maxColExtent(fragment: Fragment): number {
  return Math.max(...fragment.cells.map((p) => p.c)) + 1;
}
