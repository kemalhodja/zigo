import { describe, expect, it } from "vitest";

describe("Optical Form Scoring & Net Engine", () => {
  function calculateOpticalStats(
    totalQuestions: number,
    answers: (number | null)[],
    correctAnswers: number[],
  ) {
    let filled = 0;
    let correct = 0;
    let wrong = 0;
    let empty = 0;

    for (let i = 0; i < totalQuestions; i++) {
      const ans = answers[i];
      if (ans !== null && ans !== undefined) {
        filled++;
        if (ans === correctAnswers[i]) correct++;
        else wrong++;
      } else {
        empty++;
      }
    }

    const net = Math.max(0, correct - wrong / 3);
    const score = Math.round((correct / (totalQuestions || 1)) * 100);

    return {
      filled,
      empty,
      correct,
      wrong,
      net: Number(net.toFixed(2)),
      score,
    };
  }

  it("calculates 100% score for all correct answers", () => {
    const stats = calculateOpticalStats(
      5,
      [0, 1, 2, 3, 0], // all match
      [0, 1, 2, 3, 0],
    );

    expect(stats.filled).toBe(5);
    expect(stats.correct).toBe(5);
    expect(stats.wrong).toBe(0);
    expect(stats.empty).toBe(0);
    expect(stats.net).toBe(5);
    expect(stats.score).toBe(100);
  });

  it("applies MEB 3-wrong penalty correctly", () => {
    // 6 questions: 3 correct, 3 wrong -> Net = 3 - (3/3) = 2.00
    const stats = calculateOpticalStats(
      6,
      [0, 1, 2, 0, 0, 0],
      [0, 1, 2, 1, 1, 1],
    );

    expect(stats.correct).toBe(3);
    expect(stats.wrong).toBe(3);
    expect(stats.net).toBe(2.0);
    expect(stats.score).toBe(50);
  });

  it("handles empty answers without penalty", () => {
    // 5 questions: 3 correct, 0 wrong, 2 empty -> Net = 3.00
    const stats = calculateOpticalStats(
      5,
      [0, 1, 2, null, null],
      [0, 1, 2, 3, 4],
    );

    expect(stats.filled).toBe(3);
    expect(stats.empty).toBe(2);
    expect(stats.correct).toBe(3);
    expect(stats.wrong).toBe(0);
    expect(stats.net).toBe(3.0);
  });

  it("ensures net score does not drop below 0", () => {
    // All wrong
    const stats = calculateOpticalStats(
      4,
      [1, 2, 3, 0],
      [0, 0, 0, 1],
    );

    expect(stats.correct).toBe(0);
    expect(stats.wrong).toBe(4);
    expect(stats.net).toBe(0);
  });
});
