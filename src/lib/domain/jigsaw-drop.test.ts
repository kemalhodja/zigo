import { describe, expect, it } from "vitest";

import {
  buildDeck,
  canDrop,
  colsForLevel,
  dropFragment,
  emptyBoard,
  type Fragment,
  isBoardJammed,
  isGameOver,
  isPhotoComplete,
  type PhotoDef,
  photosForLevel,
  picturesGoalForLevel,
  type PlacedPiece,
  placePlain,
  removeTopPiece,
  resolveDrop,
  rowsForLevel,
  tallestColumnIndex,
} from "@/lib/domain/jigsaw-drop";

describe("level scaling", () => {
  it("rows grow 8→9→10→11 and cap", () => {
    expect(rowsForLevel(1)).toBe(8);
    expect(rowsForLevel(2)).toBe(9);
    expect(rowsForLevel(3)).toBe(10);
    expect(rowsForLevel(4)).toBe(11);
    expect(rowsForLevel(10)).toBe(11);
  });

  it("columns grow every other level and cap", () => {
    expect(colsForLevel(1)).toBe(4);
    expect(colsForLevel(3)).toBe(5);
    expect(colsForLevel(9)).toBe(6);
  });

  it("photo pool widens with level", () => {
    expect(photosForLevel(1).length).toBe(4);
    expect(photosForLevel(20).length).toBeLessThanOrEqual(10);
  });
});

describe("buildDeck", () => {
  it("covers every slice of every photo", () => {
    const photos = photosForLevel(1);
    const deck = buildDeck(photos);
    for (const photo of photos) {
      const covered = deck
        .filter((f) => f.photoId === photo.id)
        .reduce((sum, f) => sum + f.height, 0);
      expect(covered).toBe(photo.totalHeight);
    }
  });

  it("shuffles and includes some mystery tiles", () => {
    const deck = buildDeck(photosForLevel(3), () => 0.1); // deterministic: all face-down
    expect(deck.length).toBeGreaterThanOrEqual(6);
    expect(deck.some((f) => f.hidden)).toBe(true);
  });
});

const photo3: PhotoDef = { id: 1, emojis: ["🌻", "🪟", "🏛️"], gradient: "g", totalHeight: 3 };
const photo2: PhotoDef = { id: 2, emojis: ["🐄", "🌿"], gradient: "g", totalHeight: 2 };

function frag(photoId: number, slice: number, height: 1 | 2 | 3 = 1): Fragment {
  return { uid: Math.random(), photoId, slice, height, hidden: false };
}

function piece(photoId: number, slices: number[], height: number): PlacedPiece {
  return { photoId, slices, height, hidden: false };
}

describe("merge rules", () => {
  it("merges only when the fragment is exactly the next slice up", () => {
    const board = emptyBoard(4, 8);
    board.columns[0] = [piece(1, [1], 1)]; // middle slice sits at bottom
    const result = dropFragment(board, 0, frag(1, 0)); // top slice lands on it
    expect(result.merged).toBe(true);
    expect(result.board.columns[0]).toHaveLength(1); // merged into one piece
    expect(result.board.columns[0][0].slices).toEqual([0, 1]);
    expect(board.columns[0]).toHaveLength(1); // original untouched (pure)
  });

  it("does not merge mismatched or non-adjacent slices", () => {
    const board = emptyBoard(4, 8);
    board.columns[0] = [piece(1, [2], 1)];
    expect(dropFragment(board, 0, frag(1, 0)).merged).toBe(false); // skips slice 1
    expect(dropFragment(board, 0, frag(2, 1)).merged).toBe(false); // other photo
  });

  it("hidden pieces never merge", () => {
    const board = emptyBoard(4, 8);
    board.columns[1] = [{ ...piece(2, [0], 1), hidden: true }];
    expect(dropFragment(board, 1, frag(2, 1)).merged).toBe(false);
  });
});

describe("completion + scoring", () => {
  it("clears and scores when the photo is fully assembled", () => {
    const board = emptyBoard(4, 8);
    board.columns[0] = [piece(photo3.id, [1, 2], 2)];
    const result = resolveDrop(board, 0, frag(photo3.id, 0), photo3, 0);
    expect(result.completed).toBe(true);
    expect(result.points).toBe(300); // 100 × totalHeight, combo 0
    expect(result.board.columns[0]).toHaveLength(0);
  });

  it("applies combo multiplier on consecutive completions", () => {
    const board = emptyBoard(4, 8);
    board.columns[0] = [piece(photo2.id, [1], 1)]; // bottom slice placed
    const result = resolveDrop(board, 0, frag(photo2.id, 0), photo2, 3); // top slice caps it
    expect(result.completed).toBe(true);
    expect(result.points).toBe(Math.round(200 * Math.pow(1.5, 3)));
  });

  it("incomplete assembly stays on the board with merge bonus", () => {
    const board = emptyBoard(4, 8);
    board.columns[0] = [piece(photo3.id, [2], 1)];
    const result = resolveDrop(board, 0, frag(photo3.id, 1), photo3, 0);
    expect(result.completed).toBe(false);
    expect(result.merged).toBe(true);
    expect(result.points).toBe(10);
    expect(result.board.columns[0]).toHaveLength(1);
    expect(isPhotoComplete(result.board.columns[0][0], photo3)).toBe(false);
  });
});

describe("overflow / game over", () => {
  it("detects when no column can take the fragment", () => {
    let board = emptyBoard(2, 8);
    const single = frag(1, 0);
    for (let r = 0; r < 8; r++) {
      board = dropFragment(board, 0, single).board;
      board = dropFragment(board, 1, single).board;
    }
    expect(isGameOver(board, single)).toBe(true);
    expect(canDrop(board, 0, single)).toBe(false);
  });

  it("tall fragments need more headroom", () => {
    const board = emptyBoard(2, 8);
    board.columns[0] = [piece(1, [0], 7)];
    expect(canDrop(board, 0, frag(1, 0, 2))).toBe(false); // 7+2 > 8
    expect(canDrop(board, 0, frag(1, 0, 1))).toBe(true); // 7+1 = 8
  });
});

describe("jigsaw drop v3 — gerçek oyun mekanikleri", () => {
  it("seviye hedefi yavaş büyür ve 8'de kapaklanır", () => {
    expect(picturesGoalForLevel(1)).toBe(2);
    expect(picturesGoalForLevel(3)).toBe(3);
    expect(picturesGoalForLevel(20)).toBe(8);
  });

  it("isBoardJammed: sıradaki hiçbir parça hiçbir sütuna sığmıyorsa true", () => {
    let board = emptyBoard(2, 3);
    const single = frag(1, 0);
    for (let r = 0; r < 3; r++) {
      board = dropFragment(board, 0, single).board;
      board = dropFragment(board, 1, single).board;
    }
    expect(isBoardJammed(board, [single])).toBe(true);
    // En az bir parça bir yere sığıyorsa tıkanma yoktur
    const tall = frag(2, 0, 2);
    expect(isBoardJammed(emptyBoard(2, 3), [tall])).toBe(false);
    // Kuyruk boşsa asla tıkanma sayılmaz
    expect(isBoardJammed(board, [])).toBe(false);
  });

  it("removeTopPiece: sadece en üstteki parçayı söker (pure)", () => {
    const board = emptyBoard(2, 8);
    board.columns[1] = [piece(1, [0], 1), piece(2, [0], 2)];
    const { board: next, removed } = removeTopPiece(board, 1);
    expect(removed?.photoId).toBe(2);
    expect(next.columns[1]).toHaveLength(1);
    expect(board.columns[1]).toHaveLength(2); // orijinal korunur
  });

  it("placePlain: birleştirme/tetikleme olmadan ham yerleşim yapar", () => {
    const board = emptyBoard(2, 8);
    board.columns[0] = [piece(photo3.id, [1, 2], 2)]; // üst dilimi eksik ama placePlain birleştirmez
    const next = placePlain(board, 0, frag(photo3.id, 0));
    expect(next.columns[0]).toHaveLength(2); // tek parça olarak durur
    expect(next.columns[0][1].slices).toEqual([0]);
  });

  it("tallestColumnIndex: en dolu sütunu bulur", () => {
    const board = emptyBoard(3, 8);
    board.columns[0] = [piece(1, [0], 2)];
    board.columns[2] = [piece(1, [0], 3), piece(2, [0], 2)];
    expect(tallestColumnIndex(board)).toBe(2);
  });
});
