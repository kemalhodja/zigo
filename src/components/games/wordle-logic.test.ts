import { describe, expect, it } from "vitest";

import { bestKeyState, evaluateGuess } from "./wordle-logic";

describe("evaluateGuess", () => {
  it("marks exact matches as correct", () => {
    expect(evaluateGuess("KALEM", "KALEM")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("duplicate in guess only counts present up to target stock", () => {
    // Hedefte tek E var (3. index); diğer dört E gri kalmalı
    expect(evaluateGuess("KALEM", "EEEEE")).toEqual([
      "absent",
      "absent",
      "absent",
      "correct",
      "absent",
    ]);
  });

  it("exact match consumes target letter stock", () => {
    // Hedef KITAP'taki tek A, 3. indexte birebir eşleşir; baştaki A artık sarı olamaz
    expect(evaluateGuess("KITAP", "ATLAS")).toEqual([
      "absent",
      "present",
      "absent",
      "correct",
      "absent",
    ]);
  });

  it("mixed present and exact positions", () => {
    expect(evaluateGuess("KALEM", "MELAK")).toEqual([
      "present",
      "present",
      "correct",
      "present",
      "present",
    ]);
  });

  it("marks absent letters not in target", () => {
    const result = evaluateGuess("KALEM", "XYZVQ");
    expect(result.every((s) => s === "absent")).toBe(true);
  });
});

describe("bestKeyState", () => {
  it("prioritizes correct over present over absent", () => {
    expect(bestKeyState(["absent", "present"])).toBe("present");
    expect(bestKeyState(["present", "correct"])).toBe("correct");
    expect(bestKeyState(["empty", "absent"])).toBe("absent");
    expect(bestKeyState([])).toBe("empty");
  });
});
