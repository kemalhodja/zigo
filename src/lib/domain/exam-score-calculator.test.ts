import { describe, expect, it } from "vitest";

import {
  calcLgsNet,
  calcYksNet,
  calculateLgsScore,
  calculateYksScore,
  DEFAULT_LGS_STATE,
  DEFAULT_YKS_STATE,
} from "./exam-score-calculator";

describe("Exam Score Calculator", () => {
  describe("calcLgsNet", () => {
    it("correctly subtracts 1 for every 3 wrong answers", () => {
      expect(calcLgsNet(20, 0, 20)).toBe(20);
      expect(calcLgsNet(17, 3, 20)).toBe(16);
      expect(calcLgsNet(14, 6, 20)).toBe(12);
      expect(calcLgsNet(0, 3, 20)).toBe(0);
    });

    it("caps at max questions", () => {
      expect(calcLgsNet(25, 0, 20)).toBe(20);
    });
  });

  describe("calculateLgsScore", () => {
    it("returns base score of 100 on empty net", () => {
      const res = calculateLgsScore(DEFAULT_LGS_STATE);
      expect(res.puan).toBe(100);
      expect(res.netler.toplamNet).toBe(0);
    });

    it("returns 500 on full net (90 net)", () => {
      const fullState = {
        turkce: { correct: 20, wrong: 0 },
        matematik: { correct: 20, wrong: 0 },
        fen: { correct: 20, wrong: 0 },
        inkilap: { correct: 10, wrong: 0 },
        din: { correct: 10, wrong: 0 },
        ingilizce: { correct: 10, wrong: 0 },
      };
      const res = calculateLgsScore(fullState);
      expect(res.puan).toBe(500);
      expect(res.netler.toplamNet).toBe(90);
      expect(res.yuzdelikDilim).toContain("%0.01");
    });
  });

  describe("calcYksNet", () => {
    it("correctly subtracts 1 for every 4 wrong answers", () => {
      expect(calcYksNet(40, 0, 40)).toBe(40);
      expect(calcYksNet(36, 4, 40)).toBe(35);
      expect(calcYksNet(20, 8, 40)).toBe(18);
    });
  });

  describe("calculateYksScore", () => {
    it("calculates base OBP and scores on default state", () => {
      const res = calculateYksScore(DEFAULT_YKS_STATE);
      expect(res.tyt.hamPuan).toBe(100);
      expect(res.obpPuan).toBe(425); // 85 * 5
      expect(res.obpKatki).toBe(51); // 425 * 0.12
      expect(res.tyt.yerlestirmePuani).toBe(151);
    });

    it("calculates broken OBP if kirikObp is true", () => {
      const res = calculateYksScore({ ...DEFAULT_YKS_STATE, kirikObp: true });
      expect(res.obpKatki).toBe(25.5); // 425 * 0.06
    });

    it("calculates high scores on good nets", () => {
      const goodState = {
        ...DEFAULT_YKS_STATE,
        tyt: {
          turkce: { correct: 35, wrong: 5 },
          sosyal: { correct: 18, wrong: 2 },
          matematik: { correct: 36, wrong: 4 },
          fen: { correct: 17, wrong: 3 },
        },
        ayt: {
          ...DEFAULT_YKS_STATE.ayt,
          matematik: { correct: 35, wrong: 5 },
          fizik: { correct: 12, wrong: 2 },
          kimya: { correct: 11, wrong: 2 },
          biyoloji: { correct: 11, wrong: 2 },
        },
      };
      const res = calculateYksScore(goodState);
      expect(res.tyt.toplamNet).toBeGreaterThan(95);
      expect(res.say.hamPuan).toBeGreaterThan(420);
      expect(res.say.yerlestirmePuani).toBeGreaterThan(470);
    });
  });
});
