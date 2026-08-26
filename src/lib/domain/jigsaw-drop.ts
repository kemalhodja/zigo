/**
 * Yapboz Düşüşü v4 — gerçek Jigsaw Drop: Solitaire Puzzle klonu.
 *
 * Doğrulanmış kurallar (mağaza ekran görüntülerinden):
 *  - 5 sütunluk tahta; üstte her sütun için kapalı kart destesi.
 *  - Her resim 2-6 karta bölünür (1×2, 2×1, 2×2, 2×3…). Kartlar tahtaya
 *    dağınık başlar, kalanı destelerdedir.
 *  - Oyuncu kartları sürükler: boş göze → taşır, dolu göze → TAKAS.
 *  - Aynı resmin kartları doğru komşulukla dizilince resim TAMAMLANIR →
 *    temizlenir, puan + combo; boşalan yerlere destelerden KART YAĞAR.
 *  - Zincirleme tamamlanmalar "Combo Fever" verir.
 *  - Kapalı (👑) kartlar oyuncu onu hareket ettirince açılır; 💡 ipucu
 *      hepsini açar.
 *  - Süre yok, kayıp yok: seviye tüm kartlar temizlenince biter.
 */

export const BOARD_COLS = 5;
export const BOARD_ROWS = 4;

export type Shape = { w: number; h: number };

export type PhotoDef = {
  id: number;
  /** shape.w × shape.h adet emoji, satır-major. */
  emojis: string[];
  gradient: string;
  shape: Shape;
};

export const PHOTO_LIBRARY: Omit<PhotoDef, "id">[] = [
  { emojis: ["🌤️", "🌊"], gradient: "from-sky-300 to-cyan-500", shape: { w: 1, h: 2 } },
  { emojis: ["🌸", "🌿"], gradient: "from-pink-300 to-emerald-400", shape: { w: 1, h: 2 } },
  { emojis: ["🚗", "🛣️"], gradient: "from-rose-300 to-slate-400", shape: { w: 1, h: 2 } },
  { emojis: ["🏡", "🌳"], gradient: "from-amber-200 to-green-500", shape: { w: 1, h: 2 } },
  { emojis: ["🐈", "🧶"], gradient: "from-orange-200 to-amber-400", shape: { w: 1, h: 2 } },
  { emojis: ["🍕", "🥤"], gradient: "from-yellow-300 to-red-400", shape: { w: 2, h: 1 } },
  { emojis: ["⛄", "🌲"], gradient: "from-sky-200 to-slate-400", shape: { w: 1, h: 2 } },
  { emojis: ["🍓", "🍰"], gradient: "from-rose-300 to-pink-500", shape: { w: 2, h: 1 } },
  { emojis: ["🚂", "🛤️"], gradient: "from-emerald-300 to-slate-500", shape: { w: 1, h: 2 } },
  { emojis: ["🎨", "🖌️"], gradient: "from-violet-300 to-fuchsia-400", shape: { w: 2, h: 1 } },
  { emojis: ["🎪", "🎠"], gradient: "from-purple-300 to-rose-400", shape: { w: 1, h: 2 } },
  { emojis: ["🏖️", "🐚", "☀️", "⛱️"], gradient: "from-cyan-300 to-amber-300", shape: { w: 2, h: 2 } },
  { emojis: ["🦁", "🌾", "☀️", "🌳"], gradient: "from-yellow-300 to-orange-500", shape: { w: 2, h: 2 } },
  { emojis: ["🎈", "🎪", "🎡", "🎢"], gradient: "from-fuchsia-300 to-indigo-400", shape: { w: 2, h: 2 } },
  { emojis: ["🍎", "🧺", "🐝", "🌼"], gradient: "from-lime-300 to-red-400", shape: { w: 2, h: 2 } },
  { emojis: ["🚀", "🌙", "⭐", "🛸"], gradient: "from-indigo-400 to-slate-600", shape: { w: 2, h: 2 } },
  { emojis: ["🐳", "💧", "🌊", "🐟"], gradient: "from-blue-300 to-cyan-500", shape: { w: 2, h: 2 } },
  { emojis: ["🦋", "🌷", "🐝", "🌻"], gradient: "from-pink-300 to-yellow-300", shape: { w: 2, h: 2 } },
];

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Seviyenin resimlerinde izin verilen en fazla kart sayısı (2 → 4 → 6). */
export function maxPartsForLevel(level: number): number {
  if (level <= 2) return 2;
  if (level <= 5) return 4;
  return 6;
}

export function photosForLevel(level: number, rng: () => number = Math.random): PhotoDef[] {
  const maxParts = maxPartsForLevel(level);
  const count = Math.min(8 + (level - 1) * 2, 16);
  const eligible = PHOTO_LIBRARY.filter((p) => p.emojis.length <= maxParts);
  const picked: Omit<PhotoDef, "id">[] = [];
  let pool = shuffle(eligible, rng);
  while (picked.length < count) {
    if (pool.length === 0) pool = shuffle(eligible, rng);
    picked.push(pool.pop()!);
  }
  return picked.slice(0, count).map((p, i) => ({ ...p, id: i + 1 }));
}

export function colsForLevel(_level: number): number {
  return BOARD_COLS;
}

export function rowsForLevel(level: number): number {
  return level < 6 ? BOARD_ROWS : BOARD_ROWS + 1;
}

/** Kapalı kart oranı seviyeyle artar. */
export function hiddenRateForLevel(level: number): number {
  return Math.min(0.12 + Math.max(0, level - 1) * 0.02, 0.3);
}

/** 💡 ipucu hakları. */
export function hintChargesForLevel(level: number): number {
  return 2 + Math.floor(Math.max(0, level - 1) / 2);
}

export type Tile = {
  uid: number;
  photoId: number;
  part: number;
  hidden: boolean;
};

export type Board = {
  cols: number;
  rows: number;
  cells: (Tile | null)[];
};

let uidSeq = 1;
export function resetUids(): void {
  uidSeq = 1;
}
function nextUid(): number {
  return uidSeq++;
}

export function emptyBoard(cols: number, rows: number): Board {
  return { cols, rows, cells: Array.from({ length: cols * rows }, () => null) };
}

export function cellIndex(board: Board, row: number, col: number): number {
  return row * board.cols + col;
}

/** Kartın resim içindeki göreli konumu (satır, sütun). */
export function partOffset(shape: Shape, part: number): { dr: number; dc: number } {
  return { dr: Math.floor(part / shape.w), dc: part % shape.w };
}

export type LevelSetup = {
  photos: PhotoDef[];
  board: Board;
  stacks: Tile[][];
};

/** Seviyeyi kurar: üst sıra boş kalır, kartlar alt sıralara dağıtılır; kalan kartlar destelere gider. */
export function buildLevel(level: number, rng: () => number = Math.random): LevelSetup {
  const photos = photosForLevel(level, rng);
  const cols = colsForLevel(level);
  const rows = rowsForLevel(level);
  const hiddenRate = hiddenRateForLevel(level);

  const cards: Tile[] = [];
  for (const photo of photos) {
    for (let part = 0; part < photo.emojis.length; part++) {
      cards.push({ uid: nextUid(), photoId: photo.id, part, hidden: rng() < hiddenRate });
    }
  }
  const shuffled = shuffle(cards, rng);

  let board = emptyBoard(cols, rows);

  // Üst sıra boş kalır; kartlar alt sıralara GREEDY dağıtılır: aynı resmin
  // kartları asla komşu düşmez → başlangıçta tamamlanmış resim olamaz.
  const used = new Array(shuffled.length).fill(false);
  const photoIdAt = (r: number, c: number): number | undefined =>
    r >= 0 && r < rows && c >= 0 && c < cols ? board.cells[r * cols + c]?.photoId : undefined;
  for (let r = 1; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let pick = -1;
      for (let i = 0; i < shuffled.length; i++) {
        if (used[i]) continue;
        const pid = shuffled[i].photoId;
        if (photoIdAt(r - 1, c) === pid) continue;
        if (photoIdAt(r, c - 1) === pid) continue;
        pick = i;
        break;
      }
      if (pick === -1) pick = used.findIndex((u) => !u);
      used[pick] = true;
      board.cells[r * cols + c] = shuffled[pick];
    }
  }

  // Yerçekimi: kartlar sütunlarda aşağı çöker (üst sıra boş kalır)
  board = applyGravity(board);

  // Kalan kartlar 5 desteye dağıtılır
  const stacks: Tile[][] = Array.from({ length: cols }, () => []);
  let s = 0;
  for (let i = 0; i < shuffled.length; i++) {
    if (!used[i]) {
      stacks[s % cols].push(shuffled[i]);
      s += 1;
    }
  }

  // Başlangıçta tamamlanmış resim olmasın
  const photoById = new Map(photos.map((p) => [p.id, p]));
  let guard = 0;
  let completed = findCompletedPhotos(board, photoById);
  while (completed.length > 0 && guard < 10) {
    guard += 1;
    const photo = completed[0];
    const positions: number[] = [];
    board.cells.forEach((t, i) => {
      if (t && t.photoId === photo.id) positions.push(i);
    });
    const movable = positions.find((i) => !board.cells[i]?.hidden) ?? positions[0];
    const emptyIdx = board.cells.findIndex((c) => c === null);
    if (emptyIdx >= 0 && movable !== undefined) {
      const moved = moveTile(board, movable, emptyIdx);
      board.cells = moved.board.cells;
    }
    completed = findCompletedPhotos(board, photoById);
  }

  return { photos, board, stacks };
}

/** Tahtada doğru dizilmiş (tamamlanmış) resimleri bulur. */
export function findCompletedPhotos(board: Board, photoById: Map<number, PhotoDef>): PhotoDef[] {
  const completed: PhotoDef[] = [];
  for (const photo of photoById.values()) {
    const positions = new Map<number, number>();
    board.cells.forEach((tile, idx) => {
      if (tile && tile.photoId === photo.id) positions.set(tile.part, idx);
    });
    if (positions.size !== photo.emojis.length) continue;
    const anchor = positions.get(0)!;
    const anchorRow = Math.floor(anchor / board.cols);
    const anchorCol = anchor % board.cols;
    const a0 = partOffset(photo.shape, 0);
    let ok = true;
    for (let part = 1; part < photo.emojis.length; part++) {
      const idx = positions.get(part);
      if (idx === undefined) {
        ok = false;
        break;
      }
      const { dr, dc } = partOffset(photo.shape, part);
      const expectRow = anchorRow + dr - a0.dr;
      const expectCol = anchorCol + dc - a0.dc;
      if (Math.floor(idx / board.cols) !== expectRow || idx % board.cols !== expectCol) {
        ok = false;
        break;
      }
    }
    if (ok) completed.push(photo);
  }
  return completed;
}

/** Tamamlanmış resmin kartlarını tahtadan kaldırır. */
export function clearPhoto(board: Board, photo: PhotoDef): Board {
  return {
    ...board,
    cells: board.cells.map((t) => (t && t.photoId === photo.id ? null : t)),
  };
}

/** Boş göze taşı; dolu göze ise TAKAS et. from hücresinde kart olmalı. */
export function moveTile(
  board: Board,
  from: number,
  to: number,
): { board: Board; swapped: boolean } {
  const cells = [...board.cells];
  const tile = cells[from];
  const target = cells[to];
  if (!tile || from === to) return { board, swapped: false };
  cells[from] = target ?? null;
  cells[to] = tile;
  return { board: applyGravity({ ...board, cells }), swapped: target !== null };
}

/** Yerçekimi: Sütunlardaki boşlukları doldurmak için taşları aşağı kaydırır. */
export function applyGravity(board: Board): Board {
  const cells = [...board.cells];
  for (let c = 0; c < board.cols; c++) {
    // Sütundaki taşları al (aşağıdan yukarıya değil, yukarıdan aşağıya sırayla)
    const columnTiles = [];
    for (let r = 0; r < board.rows; r++) {
      const idx = r * board.cols + c;
      if (cells[idx] !== null) {
        columnTiles.push(cells[idx]);
        cells[idx] = null; // Önce boşalt
      }
    }
    // Aşağıdan (BOARD_ROWS - 1) başlayarak yerleştir
    let destRow = board.rows - 1;
    while (columnTiles.length > 0) {
      cells[destRow * board.cols + c] = columnTiles.pop()!;
      destRow--;
    }
  }
  return { ...board, cells };
}

/**
 * Boş gözeleri KENDİ sütunundaki desteden doldurur (kartlar üstten yağar).
 * Üst sıra her zaman boş bırakılır: desteler tahtayı asla tamamen doldurmaz.
 */
export function refillFromStacks(
  board: Board,
  stacks: Tile[][],
): { board: Board; stacks: Tile[][]; placed: Tile[] } {
  // Önce mevcut yerçekimini uygula
  const b = applyGravity(board);
  const nextStacks = stacks.map((s) => [...s]);
  const cells = [...b.cells];
  const placed: Tile[] = [];

  for (let c = 0; c < b.cols; c++) {
    // Sütundaki boş hücre sayısı (yerçekimi sonrası üstte toplanır)
    let emptyCount = 0;
    for (let r = 0; r < b.rows; r++) {
      if (cells[r * b.cols + c] === null) emptyCount++;
    }

    // Üst sıra boş kalır: en fazla (emptyCount - 1) kart düşer
    const stack = nextStacks[c];
    const toDrop = Math.max(0, Math.min(emptyCount - 1, stack.length));

    for (let i = 0; i < toDrop; i++) {
      const tile = stack.pop()!;
      const targetRow = emptyCount - 1 - i;
      cells[targetRow * b.cols + c] = tile;
      placed.push(tile);
    }
  }

  return { board: { ...b, cells }, stacks: nextStacks, placed };
}

/** Seviye bitti mi: tahta ve desteler boş. */
export function isLevelCleared(board: Board, stacks: Tile[][]): boolean {
  if (board.cells.some((c) => c !== null)) return false;
  return stacks.every((s) => s.length === 0);
}

/** Sütun tamamen dolu mu (taşma riski olan sütun — üst sıra dahil). */
export function isColumnFull(board: Board, col: number): boolean {
  for (let r = 0; r < board.rows; r++) {
    if (board.cells[r * board.cols + col] === null) return false;
  }
  return true;
}

export function pointsForPhoto(photo: PhotoDef, combo: number): number {
  return Math.round(100 * photo.emojis.length * Math.pow(1.5, Math.min(combo, 5)));
}
