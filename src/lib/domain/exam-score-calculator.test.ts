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
      expect(res.yuzdelikDilim).toBe("%40+");
      expect(res.hedefYorumu).toBeDefined();
      expect(res.tavsiyeOkullar).toBeDefined();
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
      expect(res.tavsiyeOkullar).toContain("Galatasaray");
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

    it("calculates vocational school extra points (+0.06)", () => {
      const stateWithVocational = {
        ...DEFAULT_YKS_STATE,
        meslekLisesiEkPuan: true,
        tyt: {
          ...DEFAULT_YKS_STATE.tyt,
          turkce: { correct: 20, wrong: 0 },
        },
        ayt: {
          ...DEFAULT_YKS_STATE.ayt,
          matematik: { correct: 10, wrong: 0 },
          fizik: { correct: 5, wrong: 0 },
        },
      };
      const res = calculateYksScore(stateWithVocational);
      expect(res.meslekLisesiKatki).toBe(25.5); // 425 * 0.06
      expect(res.say.ekPuanliYerlestirme).toBeDefined();
      expect(res.say.ekPuanliYerlestirme).toBe(res.say.yerlestirmePuani + 25.5);
    });

    it("enforces 0.5 net rule for TYT and AYT streams", () => {
      // 0 net in TYT Türkçe and Matematik -> TYT cannot be calculated
      const emptyTyt = {
        ...DEFAULT_YKS_STATE,
        tyt: {
          ...DEFAULT_YKS_STATE.tyt,
          sosyal: { correct: 10, wrong: 0 },
        },
      };
      const res = calculateYksScore(emptyTyt);
      expect(res.tyt.isCalculable).toBe(false);
      expect(res.say.isCalculable).toBe(false);

      // TYT satisfies 0.5 net, but AYT has 0 net -> AYT cannot be calculated
      const validTytOnly = {
        ...DEFAULT_YKS_STATE,
        tyt: {
          ...DEFAULT_YKS_STATE.tyt,
          turkce: { correct: 1, wrong: 0 },
        },
      };
      const res2 = calculateYksScore(validTytOnly);
      expect(res2.tyt.isCalculable).toBe(true);
      expect(res2.say.isCalculable).toBe(false);
      expect(res2.say.uncalculatedReason).toContain("0.5 net");
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

    it("produces exact 500 ham and 560 placement on perfect full score (TYT 120, AYT 80, Diploma 100)", () => {
      const perfectState = {
        diplomaNotu: 100,
        kirikObp: false,
        meslekLisesiEkPuan: true,
        tyt: {
          turkce: { correct: 40, wrong: 0 },
          sosyal: { correct: 20, wrong: 0 },
          matematik: { correct: 40, wrong: 0 },
          fen: { correct: 20, wrong: 0 },
        },
        ayt: {
          matematik: { correct: 40, wrong: 0 },
          fizik: { correct: 14, wrong: 0 },
          kimya: { correct: 13, wrong: 0 },
          biyoloji: { correct: 13, wrong: 0 },
          edebiyat: { correct: 24, wrong: 0 },
          tarih1: { correct: 10, wrong: 0 },
          cografya1: { correct: 6, wrong: 0 },
          tarih2: { correct: 11, wrong: 0 },
          cografya2: { correct: 11, wrong: 0 },
          felsefe: { correct: 12, wrong: 0 },
          din: { correct: 6, wrong: 0 },
          ydt: { correct: 80, wrong: 0 },
        },
      };
      const res = calculateYksScore(perfectState);
      // TYT
      expect(res.tyt.hamPuan).toBe(500);
      expect(res.tyt.yerlestirmePuani).toBe(560); // 500 + 500*0.12
      // SAY
      expect(res.say.hamPuan).toBe(500);
      expect(res.say.yerlestirmePuani).toBe(560);
      expect(res.say.ekPuanliYerlestirme).toBe(590); // 560 + 500*0.06
      // EA
      expect(res.ea.hamPuan).toBe(500);
      expect(res.ea.yerlestirmePuani).toBe(560);
      // SÖZ
      expect(res.soz.hamPuan).toBe(500);
      expect(res.soz.yerlestirmePuani).toBe(560);
      // DİL
      expect(res.dil.hamPuan).toBe(500);
      expect(res.dil.yerlestirmePuani).toBe(560);
    });

    it("clamps diploma grades outside 50-100 range correctly", () => {
      const lowDiploma = calculateYksScore({ ...DEFAULT_YKS_STATE, diplomaNotu: 30 });
      expect(lowDiploma.obpPuan).toBe(250); // 50 * 5
      expect(lowDiploma.obpKatki).toBe(30); // 250 * 0.12

      const highDiploma = calculateYksScore({ ...DEFAULT_YKS_STATE, diplomaNotu: 115 });
      expect(highDiploma.obpPuan).toBe(500); // 100 * 5
      expect(highDiploma.obpKatki).toBe(60); // 500 * 0.12
    });

    it("correctly identifies 0.5 net threshold requirements for EA, SÖZ and DİL", () => {
      const baseValidTyt = {
        ...DEFAULT_YKS_STATE,
        tyt: {
          ...DEFAULT_YKS_STATE.tyt,
          turkce: { correct: 20, wrong: 0 },
        },
      };

      // EA test with 1 net in Edebiyat
      const eaRes = calculateYksScore({
        ...baseValidTyt,
        ayt: {
          ...baseValidTyt.ayt,
          edebiyat: { correct: 1, wrong: 0 },
        },
      });
      expect(eaRes.ea.isCalculable).toBe(true);
      expect(eaRes.soz.isCalculable).toBe(true); // edebiyat is part of Sos-1 which satisfies soz too
      expect(eaRes.say.isCalculable).toBe(false); // no mat or fen
      expect(eaRes.dil.isCalculable).toBe(false); // no ydt

      // DİL test with 1 net in YDT
      const dilRes = calculateYksScore({
        ...baseValidTyt,
        ayt: {
          ...baseValidTyt.ayt,
          ydt: { correct: 1, wrong: 0 },
        },
      });
      expect(dilRes.dil.isCalculable).toBe(true);
      expect(dilRes.say.isCalculable).toBe(false);
    });
  });
});
