/**
 * Yapboz Düşüşü v2 — picture solitaire (matches the real Jigsaw Drop).
 *
 * Core loop (verified from gameplay screenshots):
 *  - Portrait board of C columns × R rows; fragments DROP into a chosen column.
 *  - Every fragment is a vertical slice (height 1-3) of a specific photo.
 *  - When a fragment lands directly on top of (or below) another slice of the
 *    SAME photo, they MERGE into a taller piece.
 *  - When a merged piece reaches the photo's full height → the picture is
 *    complete → it clears, score + combo increment.
 *  - Face-down mystery tiles reveal their photo when placed.
 *  - Game over: the chosen column would overflow.
 */

export const START_ROWS = 8;
export const MAX_ROWS = 11;
export const START_COLS = 4;
export const MAX_COLS = 6;

export type PhotoDef = {
  id: number;
  /** Emoji stack rendered top-to-bottom inside the photo. */
  emojis: string[];
  /** Tailwind gradient classes for the scene background. */
  gradient: string;
  /** Total height in cells (2 or 3). */
  totalHeight: 2 | 3;
};

export const PHOTO_LIBRARY: Omit<PhotoDef, "id">[] = [
  { emojis: ["🌬️", "🏰", "🌾"], gradient: "from-sky-300 to-emerald-300", totalHeight: 3 },
  { emojis: ["🐄", "🌿"], gradient: "from-lime-300 to-green-500", totalHeight: 2 },
  { emojis: ["🌊", "⛵"], gradient: "from-cyan-300 to-blue-500", totalHeight: 2 },
  { emojis: ["🌻", "🪟", "🏛️"], gradient: "from-amber-200 to-orange-400", totalHeight: 3 },
  { emojis: ["🚲", "🌉"], gradient: "from-orange-300 to-rose-400", totalHeight: 2 },
  { emojis: ["📻", "🧀"], gradient: "from-yellow-200 to-amber-500", totalHeight: 2 },
  { emojis: ["☕", "🍎"], gradient: "from-rose-200 to-pink-400", totalHeight: 2 },
  { emojis: ["🗼", "🕊️", "🌆"], gradient: "from-indigo-300 to-purple-400", totalHeight: 3 },
  { emojis: ["🍋", "🫙"], gradient: "from-yellow-300 to-lime-400", totalHeight: 2 },
  { emojis: ["🐦", "☁️", "🌇"], gradient: "from-slate-300 to-sky-400", totalHeight: 3 },
];

export function photosForLevel(level: number): PhotoDef[] {
  const count = Math.min(4 + Math.floor((level - 1) / 2), PHOTO_LIBRARY.length);
  const shuffled = [...PHOTO_LIBRARY]
    .map((p) => ({ p, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map(({ p }) => p);
  return shuffled.slice(0, count).map((p, i) => ({ ...p, id: i + 1 }));
}

export function rowsForLevel(level: number): number {
  return Math.min(START_ROWS + Math.max(0, level - 1), MAX_ROWS);
}

export function colsForLevel(level: number): number {
  return Math.min(START_COLS + Math.floor(Math.max(0, level - 1) / 2), MAX_COLS);
}

/** A placed or queued piece: one vertical slice of a photo. */
export type Fragment = {
  uid: number;
  photoId: number;
  /** Which slice of the photo (0-based from top). */
  slice: number;
  /** Cell height of this slice. */
  height: 1 | 2 | 3;
  /** Mystery card: face-down until placed. */
  hidden: boolean;
};

/** A merged stack sitting in a column: one or more contiguous slices. */
export type PlacedPiece = {
  photoId: number;
  /** Sorted slice indices currently held, e.g. [0,1] of a 3-tall photo. */
  slices: number[];
  height: number;
  hidden: boolean;
};

export type Board = {
  cols: number;
  rows: number;
  /** Each column is a bottom-up stack of placed pieces. */
  columns: PlacedPiece[][];
};

export function emptyBoard(cols: number, rows: number): Board {
  return { cols, rows, columns: Array.from({ length: cols }, () => []) };
}

let uidSeq = 1;
export function resetUids(): void {
  uidSeq = 1;
}

function nextUid(): number {
  return uidSeq++;
}

/** Builds the fragment deck for a set of photos (every slice becomes a piece). */
export function buildDeck(photos: PhotoDef[], rng: () => number = Math.random): Fragment[] {
  const fragments: Fragment[] = [];
  for (const photo of photos) {
    let slice = 0;
    let remaining = photo.totalHeight;
    while (remaining > 0) {
      const h = remaining >= 2 && rng() < 0.45 ? 2 : 1;
      const height = Math.min(h, remaining) as 1 | 2 | 3;
      fragments.push({
        uid: nextUid(),
        photoId: photo.id,
        slice,
        height,
        hidden: rng() < 0.18, // ~18% arrive face-down
      });
      slice += 1;
      remaining -= height;
    }
  }
  // Shuffle
  for (let i = fragments.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [fragments[i], fragments[j]] = [fragments[j], fragments[i]];
  }
  return fragments;
}

export function columnHeight(column: PlacedPiece[]): number {
  return column.reduce((sum, piece) => sum + piece.height, 0);
}

export function canDrop(board: Board, col: number, fragment: Fragment): boolean {
  if (col < 0 || col >= board.cols) return false;
  return columnHeight(board.columns[col]) + fragment.height <= board.rows;
}

/**
 * Drops the fragment onto a column, then resolves merges + completions.
 * Pure: returns new board plus scoring info.
 */
export function dropFragment(
  board: Board,
  col: number,
  fragment: Fragment,
): {
  board: Board;
  merged: boolean;
} {
  const columns = board.columns.map((c) => [...c]);
  const column = columns[col];

  let piece: PlacedPiece = {
    photoId: fragment.photoId,
    slices: [fragment.slice],
    height: fragment.height,
    hidden: fragment.hidden,
  };

  // Merge with the piece directly below if it is the same photo AND this
  // fragment is exactly the next slice up (keeps the picture contiguous).
  const below = column[column.length - 1];
  if (
    below &&
    below.photoId === fragment.photoId &&
    !below.hidden &&
    !fragment.hidden &&
    fragment.slice === Math.min(...below.slices) - 1
  ) {
    const mergedSlices = [...new Set([...below.slices, fragment.slice])].sort((a, b) => a - b);
    piece = {
      photoId: fragment.photoId,
      slices: mergedSlices,
      height: below.height + fragment.height,
      hidden: false,
    };
    column.pop();
  }

  column.push(piece);

  return { board: { cols: board.cols, rows: board.rows, columns }, merged: piece.slices.length > 1 };
}

/** Whether a placed piece now contains every slice of its photo. */
export function isPhotoComplete(piece: PlacedPiece, photo: PhotoDef): boolean {
  if (piece.hidden) return false;
  if (piece.slices.length !== photo.totalHeight) return false;
  for (let s = 0; s < photo.totalHeight; s++) {
    if (!piece.slices.includes(s)) return false;
  }
  return true;
}

export type DropResolution = {
  board: Board;
  completed: boolean;
  merged: boolean;
  points: number;
};

export function resolveDrop(
  board: Board,
  col: number,
  fragment: Fragment,
  photo: PhotoDef,
  combo: number,
): DropResolution {
  const { board: nextBoard, merged } = dropFragment(board, col, fragment);
  const column = nextBoard.columns[col];
  const top = column[column.length - 1];

  if (top && isPhotoComplete(top, photo)) {
    column.pop();
    const base = 100 * photo.totalHeight;
    const points = Math.round(base * Math.pow(1.5, Math.min(combo, 5)));
    return { board: nextBoard, completed: true, merged, points };
  }

  return { board: nextBoard, completed: false, merged, points: merged ? 10 : 0 };
}

export function isGameOver(board: Board, fragment: Fragment): boolean {
  for (let c = 0; c < board.cols; c++) {
    if (canDrop(board, c, fragment)) return false;
  }
  return true;
}
