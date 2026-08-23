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
