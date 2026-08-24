import type { PipeType } from "./pipe-cell";

export type PipeDirs = [boolean, boolean, boolean, boolean];

export const BASE_DIRECTIONS: Record<PipeType, PipeDirs> = {
  empty: [false, false, false, false],
  source: [true, true, true, true],
  target: [true, true, true, true],
  straight: [true, false, true, false],
  corner: [true, true, false, false],
  t_junction: [false, true, true, true],
  cross: [true, true, true, true],
};

/** Yön dizisini verilen derece kadar saat yönünde döndürür. */
export function rotateDirections(dirs: PipeDirs, rotation: number): PipeDirs {
  const steps = (rotation / 90) % 4;
  const newDirs = [...dirs] as PipeDirs;
  for (let i = 0; i < steps; i++) {
    const last = newDirs.pop()!;
    newDirs.unshift(last);
  }
  return newDirs;
}

/**
 * Verilen ızgarada (her hücrenin type + rotation'ı bilinir) kaynaktan hedefe
 * akış ulaşıyor mu diye BFS ile bakar. Üretecin ürettiği bölümlerin
 * çözülebilirliğini doğrulamak için kullanılır.
 */
export function flowReachesTarget(
  grid: { type: PipeType; rotation?: number; correctRotation?: number }[][]
): boolean {
  const rows = grid.length;
  if (rows === 0) return false;
  const cols = grid[0].length;

  let startR = -1, startC = -1, targetR = -1, targetC = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === "source") { startR = r; startC = c; }
      if (grid[r][c].type === "target") { targetR = r; targetC = c; }
    }
  }
  if (startR === -1 || targetR === -1) return false;

  const rotationOf = (r: number, c: number): number =>
    grid[r][c].rotation ?? grid[r][c].correctRotation ?? 0;

  const queue: [number, number][] = [[startR, startC]];
  const visited = new Set<string>([`${startR},${startC}`]);
  const dRow = [-1, 0, 1, 0];
  const dCol = [0, 1, 0, -1];
  const oppositeDir = [2, 3, 0, 1];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === targetR && c === targetC) return true;
    const dirs = rotateDirections(BASE_DIRECTIONS[grid[r][c].type], rotationOf(r, c));
    for (let dir = 0; dir < 4; dir++) {
      if (!dirs[dir]) continue;
      const nR = r + dRow[dir];
      const nC = c + dCol[dir];
      if (nR < 0 || nR >= rows || nC < 0 || nC >= cols) continue;
      const neighbor = grid[nR][nC];
      if (neighbor.type === "empty") continue;
      const neighborDirs = rotateDirections(BASE_DIRECTIONS[neighbor.type], rotationOf(nR, nC));
      if (!neighborDirs[oppositeDir[dir]]) continue;
      const key = `${nR},${nC}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push([nR, nC]);
    }
  }
  return false;
}
