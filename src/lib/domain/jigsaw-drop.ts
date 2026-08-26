/**
 * Yapboz Düşüşü v3 — birebir Jigsaw Drop: Solitaire Puzzle kopyası.
 *
 * Gerçek oyunun doğrulanmış kuralları:
 *  - ZAMANLAYICI YOK: parçalar kendiliğinden düşmez; oyuncu bir sütuna
 *    dokunur ve sıradaki parça o sütuna anında düşer.
 *  - Her parça belirli bir fotoğrafın dikey dilimidir (yükseklik 1-3).
 *  - Aynı fotoğrafın üst üste gelen dilimleri BİRLEŞİR.
 *  - Fotoğraf tamamlanınca temizlenir → puan + combo ve boşluğa YENİ
 *    PARÇALAR YAĞAR (kaskad dolum) — oyunun imza mekaniği.
 *  - Gizemli kapalı kartlar yerleşince açılır.
 *  - Seviye hedefi: N resim tamamla → seviye biter, galeri gösterilir,
 *    tahta büyür ve yeni bölüm başlar.
 *  - Sihirli Değnek 🪄 boosterı en üst parçayı buğular.
 *  - Oyun sadece tahta tamamen tıkandığında biter (sakin, stressiz).
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

/** Seviyeyi bitirmek için tamamlanması gereken resim sayısı. */
export function picturesGoalForLevel(level: number): number {
  return Math.min(2 + Math.floor(Math.max(0, level - 1) / 2), 8);
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

/** Klasik kontrol: tek bir parça hiçbir yere sığmıyorsa oyun biter. */
export function isGameOver(board: Board, fragment: Fragment): boolean {
  for (let c = 0; c < board.cols; c++) {
    if (canDrop(board, c, fragment)) return false;
  }
  return true;
}

/**
 * Gerçek oyundaki tıkanma kuralı: sıradaki HİÇBİR parça hiçbir sütuna
 * sığmıyorsa tahta kilitlenmiştir (değnek yoksa oyun biter).
 */
export function isBoardJammed(board: Board, fragments: Fragment[]): boolean {
  if (fragments.length === 0) return false;
  for (const f of fragments) {
    for (let c = 0; c < board.cols; c++) {
      if (canDrop(board, c, f)) return false;
    }
  }
  return true;
}

/** En dolu sütunun indeksi (Sihirli Değnek hedefi). */
export function tallestColumnIndex(board: Board): number {
  let best = 0;
  let bestH = -1;
  for (let c = 0; c < board.cols; c++) {
    const h = columnHeight(board.columns[c]);
    if (h > bestH) {
      bestH = h;
      best = c;
    }
  }
  return best;
}

/** Değnek etkisi: sütunun EN ÜSTTEKİ yerleşik parçasını buğular. Pure. */
export function removeTopPiece(
  board: Board,
  col: number,
): { board: Board; removed: PlacedPiece | null } {
  const columns = board.columns.map((c) => [...c]);
  const removed = columns[col].pop() ?? null;
  return { board: { cols: board.cols, rows: board.rows, columns }, removed };
}

/**
 * Kaskad dolum: temizlenen boşluğa düşen taze parçalar. Birleştirme ve
 * tamamlama tetiklemez — tek başına yerleşir (zincir reaksiyon yok).
 * Pure.
 */
export function placePlain(board: Board, col: number, fragment: Fragment): Board {
  const columns = board.columns.map((c) => [...c]);
  columns[col].push({
    photoId: fragment.photoId,
    slices: [fragment.slice],
    height: fragment.height,
    hidden: false,
  });
  return { cols: board.cols, rows: board.rows, columns };
}
