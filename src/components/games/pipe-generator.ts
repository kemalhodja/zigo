import type { PipeType } from "./pipe-cell";
import { BASE_DIRECTIONS, flowReachesTarget, rotateDirections } from "./pipe-logic";

export type PipeTemplateCell = { type: PipeType; correctRotation: number };
export type PipeTemplate = PipeTemplateCell[][];

type Dirs = [boolean, boolean, boolean, boolean];

const MAX_ATTEMPTS = 8;

/** 0..1 aralığında deterministik sahte rastgelelik (testler için). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dirIndex(dr: number, dc: number): number {
  if (dr === -1) return 0; // yukarı
  if (dc === 1) return 1; // sağ
  if (dr === 1) return 2; // aşağı
  return 3; // sol
}

function findRotation(type: PipeType, need: Dirs, rng: () => number): number {
  const valid: number[] = [];
  for (let steps = 0; steps < 4; steps++) {
    const rot = steps * 90;
    const dirs = rotateDirections(BASE_DIRECTIONS[type], rot);
    if (need.every((b, i) => !b || dirs[i])) valid.push(rot);
  }
  if (valid.length === 0) return 0;
  return valid[Math.floor(rng() * valid.length)];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Preset bölümler bitince devreye giren sonsuz bölüm üreteci.
 *
 * Zorluk kademeleri (Flow Free prensipleri):
 * - Izgara boyutu 5 -> 7 arası büyür (her 8 seviyede bir kademe)
 * - Kaynak-hedef arası rastgele kıvrımlı yol uzar
 * - Çeldirici boru yoğunluğu %35'ten %60'a çıkar
 *
 * Garanti: Üretilen her bölüm, doğru rotasyonlarla kaynaktan hedefe
 * çözülebilir (flowReachesTarget ile doğrulanır).
 */
export function generatePipeLevel(
  levelIndex: number,
  presetCount: number,
  rng: () => number = Math.random,
): PipeTemplate {
  let template: PipeTemplate | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS && !template; attempt++) {
    const candidate = tryGenerate(levelIndex, presetCount, rng);
    if (candidate && flowReachesTarget(candidate)) template = candidate;
  }
  // Son çare: en basit güvenli bölüm (asla olmaması gereken durum)
  return template ?? fallbackTemplate();
}

function tryGenerate(
  levelIndex: number,
  presetCount: number,
  rng: () => number,
): PipeTemplate | null {
  const tier = Math.max(0, levelIndex - presetCount);
  const size = Math.min(5 + Math.floor(tier / 8), 7);
  const decoyRatio = Math.min(0.35 + tier * 0.04, 0.6);

  // Köşeden köşeye 4 farklı yön, tahmin edilebilirliği azaltır
  const corners: [number, number][] = [
    [0, 0], [0, size - 1], [size - 1, 0], [size - 1, size - 1],
  ];
  const startIdx = Math.floor(rng() * 4);
  const targetIdx = (startIdx + 2) % 4;
  const [sr, sc] = corners[startIdx];
  const [tr, tc] = corners[targetIdx];

  const template: PipeTemplate = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ type: "empty" as PipeType, correctRotation: 0 }))
  );

  // Rastgele kendiyle kesişmeyen yol (randomized DFS)
  const visited = new Set<number>([sr * size + sc]);
  const stack: [number, number][] = [[sr, sc]];
  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    if (r === tr && c === tc) break;
    const options: [number, number][] = [];
    const dRow = [-1, 0, 1, 0];
    const dCol = [0, 1, 0, -1];
    for (let d = 0; d < 4; d++) {
      const nR = r + dRow[d];
      const nC = c + dCol[d];
      if (nR < 0 || nR >= size || nC < 0 || nC >= size) continue;
      if (visited.has(nR * size + nC)) continue;
      options.push([nR, nC]);
    }
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const [nR, nC] = options[Math.floor(rng() * options.length)];
    visited.add(nR * size + nC);
    stack.push([nR, nC]);
  }

  if (stack.length < 3) return null; // çok kısa yol → yeniden dene

  template[sr][sc] = { type: "source", correctRotation: 0 };
  template[tr][tc] = { type: "target", correctRotation: 0 };

  for (let i = 1; i < stack.length - 1; i++) {
    const [r, c] = stack[i];
    const [pr, pc] = stack[i - 1];
    const [nr, nc] = stack[i + 1];
    const need: Dirs = [false, false, false, false];
    need[dirIndex(pr - r, pc - c)] = true;
    need[dirIndex(nr - r, nc - c)] = true;
    const opposite = (need[0] && need[2]) || (need[1] && need[3]);
    const type: PipeType = opposite ? "straight" : "corner";
    template[r][c] = { type, correctRotation: findRotation(type, need, rng) };
  }

  // Çeldirici borular (boş hücrelerin bir kısmına rastgele parçalar)
  const freeCells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (template[r][c].type === "empty") freeCells.push([r, c]);
    }
  }
  const decoyCount = Math.floor(freeCells.length * decoyRatio);
  const decoyPool: PipeType[] = [
    "straight", "straight", "corner", "corner", "corner",
    "t_junction", "cross",
  ];
  for (const [r, c] of shuffle(freeCells, rng).slice(0, decoyCount)) {
    const type = decoyPool[Math.floor(rng() * decoyPool.length)];
    template[r][c] = { type, correctRotation: Math.floor(rng() * 4) * 90 };
  }

  return template;
}

function fallbackTemplate(): PipeTemplate {
  // 5x5 güvenli S-yolu: kaynak (0,0) -> hedef (4,4)
  const size = 5;
  const t: PipeTemplate = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ type: "empty" as PipeType, correctRotation: 0 }))
  );
  t[0][0] = { type: "source", correctRotation: 0 };
  t[size - 1][size - 1] = { type: "target", correctRotation: 0 };
  const path: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 4], [2, 4], [3, 4],
    [3, 3], [3, 2], [3, 1], [3, 0],
    [4, 0],
  ];
  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    const prev = i === 0 ? [0, 0] as [number, number] : path[i - 1];
    const next = i === path.length - 1 ? [size - 1, size - 1] as [number, number] : path[i + 1];
    const need: Dirs = [false, false, false, false];
    need[dirIndex(prev[0] - cell[0], prev[1] - cell[1])] = true;
    need[dirIndex(next[0] - cell[0], next[1] - cell[1])] = true;
    const opposite = (need[0] && need[2]) || (need[1] && need[3]);
    const type: PipeType = opposite ? "straight" : "corner";
    t[cell[0]][cell[1]] = { type, correctRotation: findRotation(type, need, mulberry32(i + 1)) };
  }
  return t;
}
