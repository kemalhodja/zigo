import { describe, expect, it } from "vitest";

import {
  type Board,
  buildLevel,
  clearPhoto,
  colsForLevel,
  emptyBoard,
  findCompletedPhotos,
  hiddenRateForLevel,
  hintChargesForLevel,
  isLevelCleared,
  maxPartsForLevel,
  moveTile,
  partOffset,
  type PhotoDef,
  photosForLevel,
  pointsForPhoto,
  refillFromStacks,
  rowsForLevel,
  type Tile,
} from "@/lib/domain/jigsaw-drop";

function photo2v(id: number): PhotoDef {
  return { id, emojis: ["🌤️", "🌊"], gradient: "g", shape: { w: 1, h: 2 } };
}

function photo2h(id: number): PhotoDef {
  return { id, emojis: ["🍕", "🥤"], gradient: "g", shape: { w: 2, h: 1 } };
}

function photo4(id: number): PhotoDef {
  return { id, emojis: ["🏖️", "🐚", "☀️", "⛱️"], gradient: "g", shape: { w: 2, h: 2 } };
}

function board5x4(): Board {
  return emptyBoard(5, 4);
}

describe("seviye ölçekleme", () => {
  it("tahta 5 sütun sabit, satır 6. seviyede 5'e çıkar", () => {
    expect(colsForLevel(1)).toBe(5);
    expect(rowsForLevel(1)).toBe(4);
    expect(rowsForLevel(6)).toBe(5);
  });

  it("parça limiti 2 → 4 → 6 büyür", () => {
    expect(maxPartsForLevel(1)).toBe(2);
    expect(maxPartsForLevel(3)).toBe(4);
    expect(maxPartsForLevel(6)).toBe(6);
  });

  it("resim havuzu seviyeyle büyür ve şekil kuralına uyar", () => {
    const l1 = photosForLevel(1);
    expect(l1.length).toBe(8);
    expect(l1.every((p) => p.emojis.length <= 2)).toBe(true);
    const l3 = photosForLevel(3);
    expect(l3.length).toBe(12);
    expect(l3.every((p) => p.emojis.length <= 4)).toBe(true);
    expect(photosForLevel(20).length).toBe(16);
  });

  it("kapalı kart oranı artar, ipucu hakları büyür", () => {
    expect(hiddenRateForLevel(1)).toBeLessThan(hiddenRateForLevel(10));
    expect(hiddenRateForLevel(50)).toBe(0.3);
    expect(hintChargesForLevel(1)).toBe(2);
    expect(hintChargesForLevel(3)).toBe(3);
  });
});

describe("buildLevel", () => {
  it("alt sıralar kartla dolu başlar, üst sıra boş kalır, kalan kartlar destelerde", () => {
    const setup = buildLevel(1);
    const boardTiles = setup.board.cells.filter((c) => c !== null).length;
    const stackTiles = setup.stacks.reduce((s, x) => s + x.length, 0);
    const total = setup.photos.reduce((s, p) => s + p.emojis.length, 0);
    expect(boardTiles).toBe(5 * 3); // 4 satırın alt 3'ü dolu
    expect(boardTiles + stackTiles).toBe(total);
    // Üst sıra boş
    for (let c = 0; c < 5; c++) {
      expect(setup.board.cells[c]).toBeNull();
    }
  });

  it("başlangıç tahtasında tamamlanmış resim olmaz", () => {
    for (let lvl = 1; lvl <= 4; lvl++) {
      const setup = buildLevel(lvl);
      const byId = new Map(setup.photos.map((p) => [p.id, p]));
      expect(findCompletedPhotos(setup.board, byId)).toHaveLength(0);
    }
  });
});

describe("resim tamamlama", () => {
  it("1×2 resim doğru dizilince bulunur, yanlışta bulunmaz", () => {
    const photo = photo2v(1);
    const byId = new Map([[1, photo]]);
    const b = board5x4();
    b.cells[7] = { uid: 1, photoId: 1, part: 0, hidden: false }; // satır 1, kol 2
    b.cells[12] = { uid: 2, photoId: 1, part: 1, hidden: false }; // satır 2, kol 2
    expect(findCompletedPhotos(b, byId)).toEqual([photo]);

    b.cells[12] = { uid: 2, photoId: 1, part: 1, hidden: false }; // aynı kol ama...
    b.cells[12] = null;
    b.cells[11] = { uid: 2, photoId: 1, part: 1, hidden: false }; // yanlış konum
    expect(findCompletedPhotos(b, byId)).toHaveLength(0);
  });

  it("2×1 yatay ve 2×2 resimler de doğrulanır", () => {
    const h = photo2h(1);
    const q = photo4(2);
    const byId = new Map([
      [1, h],
      [2, q],
    ]);
    const b = board5x4();
    b.cells[6] = { uid: 1, photoId: 1, part: 0, hidden: false }; // (1,1)
    b.cells[7] = { uid: 2, photoId: 1, part: 1, hidden: false }; // (1,2)
    b.cells[12] = { uid: 3, photoId: 2, part: 0, hidden: false }; // (2,2)
    b.cells[13] = { uid: 4, photoId: 2, part: 1, hidden: false }; // (2,3)
    b.cells[17] = { uid: 5, photoId: 2, part: 2, hidden: false }; // (3,2)
    b.cells[18] = { uid: 6, photoId: 2, part: 3, hidden: false }; // (3,3)
    expect(findCompletedPhotos(b, byId)).toEqual([h, q]);
  });

  it("eksik parçayla tamamlanmaz", () => {
    const q = photo4(1);
    const byId = new Map([[1, q]]);
    const b = board5x4();
    b.cells[0] = { uid: 1, photoId: 1, part: 0, hidden: false };
    b.cells[1] = { uid: 2, photoId: 1, part: 1, hidden: false };
    b.cells[5] = { uid: 3, photoId: 1, part: 2, hidden: false };
    expect(findCompletedPhotos(b, byId)).toHaveLength(0);
  });
});

describe("taşıma ve takas", () => {
  it("boş göze taşır, yerçekimi kartı sütun tabanına indirir", () => {
    const b = board5x4();
    b.cells[0] = { uid: 1, photoId: 1, part: 0, hidden: true };
    const { board: next, swapped } = moveTile(b, 0, 6); // hücre 6 = (1,1) kol 1
    expect(swapped).toBe(false);
    expect(next.cells[0]).toBeNull();
    expect(next.cells[16]?.uid).toBe(1); // kol 1'in tabanı (3,1)
    expect(b.cells[0]?.uid).toBe(1); // pure
  });

  it("dolu gözle takas eder", () => {
    const b = board5x4();
    b.cells[0] = { uid: 1, photoId: 1, part: 0, hidden: false };
    b.cells[1] = { uid: 2, photoId: 2, part: 0, hidden: false };
    const { board: next, swapped } = moveTile(b, 0, 1);
    expect(swapped).toBe(true);
    expect(next.cells[15]?.uid).toBe(2); // kol 0 tabanı
    expect(next.cells[16]?.uid).toBe(1); // kol 1 tabanı
  });
});

describe("yerçekimi, deste dolumu ve seviye bitişi", () => {
  it("applyGravity taşları sütunlarda aşağı çöker", async () => {
    const { applyGravity } = await import("@/lib/domain/jigsaw-drop");
    const b = board5x4();
    b.cells[0] = { uid: 1, photoId: 1, part: 0, hidden: false }; // (0,0)
    b.cells[10] = { uid: 2, photoId: 2, part: 0, hidden: false }; // (2,0)
    const next = applyGravity(b);
    // Görece sıra korunur: alttaki (uid2) en altta kalır
    expect(next.cells[15]?.uid).toBe(2); // kol 0 tabanı
    expect(next.cells[10]?.uid).toBe(1); // (2,0)
    expect(next.cells[0]).toBeNull();
  });

  it("refill kendi sütunundaki desteden doldurur ve üst sırayı boş bırakır", () => {
    const b = board5x4(); // tamamen boş tahta
    const stacks: Tile[][] = [
      [
        { uid: 1, photoId: 1, part: 0, hidden: false },
        { uid: 2, photoId: 1, part: 1, hidden: false },
        { uid: 3, photoId: 2, part: 0, hidden: false },
        { uid: 4, photoId: 2, part: 1, hidden: false },
        { uid: 5, photoId: 3, part: 0, hidden: false },
      ],
      [],
      [],
      [],
      [],
    ];
    const { board: next, stacks: nextStacks, placed } = refillFromStacks(b, stacks);
    // 4 boş göze var ama sadece 3 kart düşer (üst sıra boş kalır); deste SONDAN çekilir
    expect(placed).toHaveLength(3);
    expect(next.cells[15]?.uid).toBe(5); // (3,0)
    expect(next.cells[10]?.uid).toBe(4); // (2,0)
    expect(next.cells[5]?.uid).toBe(3); // (1,0)
    expect(next.cells[0]).toBeNull();
    expect(nextStacks[0]).toHaveLength(2);
  });

  it("refill dolu sütuna kart çekmez", () => {
    const b = board5x4();
    // Kol 0 tabanında bir kart, destesi boş
    b.cells[15] = { uid: 9, photoId: 1, part: 0, hidden: false };
    // Kol 1 tamamen dolu, destesinde kart var
    for (let r = 0; r < 4; r++) {
      b.cells[r * 5 + 1] = { uid: 100 + r, photoId: 2, part: 0, hidden: false };
    }
    const stacks: Tile[][] = [[], [{ uid: 8, photoId: 3, part: 0, hidden: false }], [], [], []];
    const { board: next, stacks: nextStacks, placed } = refillFromStacks(b, stacks);
    expect(placed).toHaveLength(0);
    expect(next.cells[15]?.uid).toBe(9);
    expect(nextStacks[1]).toHaveLength(1);
  });

  it("isColumnFull dolu sütunu bulur", async () => {
    const { isColumnFull } = await import("@/lib/domain/jigsaw-drop");
    const b = board5x4();
    for (let r = 0; r < 4; r++) {
      b.cells[r * 5] = { uid: r, photoId: 1, part: 0, hidden: false };
    }
    expect(isColumnFull(b, 0)).toBe(true);
    expect(isColumnFull(b, 1)).toBe(false);
  });

  it("tahta ve desteler boşken seviye biter", () => {
    const b = board5x4();
    expect(isLevelCleared(b, [[], []])).toBe(true);
    b.cells[3] = { uid: 1, photoId: 1, part: 0, hidden: false };
    expect(isLevelCleared(b, [[], []])).toBe(false);
  });

  it("clearPhoto yalnızca o resmin kartlarını kaldırır", () => {
    const photo = photo2v(1);
    const b = board5x4();
    b.cells[0] = { uid: 1, photoId: 1, part: 0, hidden: false };
    b.cells[5] = { uid: 2, photoId: 1, part: 1, hidden: false };
    b.cells[6] = { uid: 3, photoId: 2, part: 0, hidden: false };
    const next = clearPhoto(b, photo);
    expect(next.cells[0]).toBeNull();
    expect(next.cells[5]).toBeNull();
    expect(next.cells[6]?.uid).toBe(3);
  });
});

describe("yardımcılar", () => {
  it("partOffset satır-major konum verir", () => {
    expect(partOffset({ w: 2, h: 2 }, 0)).toEqual({ dr: 0, dc: 0 });
    expect(partOffset({ w: 2, h: 2 }, 1)).toEqual({ dr: 0, dc: 1 });
    expect(partOffset({ w: 2, h: 2 }, 2)).toEqual({ dr: 1, dc: 0 });
    expect(partOffset({ w: 1, h: 2 }, 1)).toEqual({ dr: 1, dc: 0 });
  });

  it("puan combo ile katlanır", () => {
    expect(pointsForPhoto(photo2v(1), 0)).toBe(200);
    expect(pointsForPhoto(photo2v(1), 2)).toBe(Math.round(200 * 2.25));
  });
});
