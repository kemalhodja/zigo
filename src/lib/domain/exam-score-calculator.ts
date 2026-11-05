/**
 * Zigo LGS ve YKS Puan Hesaplama Motoru
 * MEB ve ÖSYM resmi katsayıları ve standart puanlama kurallarına göre çalışır.
 */

// --- LGS (Liselere Geçiş Sistemi) ---

export type LgsSubjectInput = {
  correct: number;
  wrong: number;
};

export type LgsFormState = {
  turkce: LgsSubjectInput;
  matematik: LgsSubjectInput;
  fen: LgsSubjectInput;
  inkilap: LgsSubjectInput;
  din: LgsSubjectInput;
  ingilizce: LgsSubjectInput;
};

export type LgsCalculationResult = {
  netler: {
    turkce: number;
    matematik: number;
    fen: number;
    inkilap: number;
    din: number;
    ingilizce: number;
    toplamNet: number;
  };
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  puan: number; // 100 - 500
  yuzdelikDilim: string; // örn: "%0.05 - %0.30"
  tavsiyeOkullar: string;
};

export const DEFAULT_LGS_STATE: LgsFormState = {
  turkce: { correct: 0, wrong: 0 },
  matematik: { correct: 0, wrong: 0 },
  fen: { correct: 0, wrong: 0 },
  inkilap: { correct: 0, wrong: 0 },
  din: { correct: 0, wrong: 0 },
  ingilizce: { correct: 0, wrong: 0 },
};

export function calcLgsNet(correct: number, wrong: number, maxQuestions: number): number {
  const safeCorrect = Math.max(0, Math.min(maxQuestions, Number(correct) || 0));
  const safeWrong = Math.max(0, Math.min(maxQuestions - safeCorrect, Number(wrong) || 0));
  const net = safeCorrect - safeWrong / 3;
  return Math.max(0, Math.round(net * 100) / 100);
}

export function calculateLgsScore(state: LgsFormState): LgsCalculationResult {
  const netTurkce = calcLgsNet(state.turkce.correct, state.turkce.wrong, 20);
  const netMatematik = calcLgsNet(state.matematik.correct, state.matematik.wrong, 20);
  const netFen = calcLgsNet(state.fen.correct, state.fen.wrong, 20);
  const netInkilap = calcLgsNet(state.inkilap.correct, state.inkilap.wrong, 10);
  const netDin = calcLgsNet(state.din.correct, state.din.wrong, 10);
  const netIngilizce = calcLgsNet(state.ingilizce.correct, state.ingilizce.wrong, 10);

  const toplamNet = Math.round((netTurkce + netMatematik + netFen + netInkilap + netDin + netIngilizce) * 100) / 100;

  const toplamDogru =
    (state.turkce.correct || 0) +
    (state.matematik.correct || 0) +
    (state.fen.correct || 0) +
    (state.inkilap.correct || 0) +
    (state.din.correct || 0) +
    (state.ingilizce.correct || 0);

  const toplamYanlis =
    (state.turkce.wrong || 0) +
    (state.matematik.wrong || 0) +
    (state.fen.wrong || 0) +
    (state.inkilap.wrong || 0) +
    (state.din.wrong || 0) +
    (state.ingilizce.wrong || 0);

  const toplamBos = Math.max(0, 90 - (toplamDogru + toplamYanlis));

  // MEB LGS Standart Ağırlıklı Puan Modeli
  // Tam net (90) = 500.000 puan, Sıfır net = 100.000 puan
  const agirlikliPuan =
    netTurkce * 4.341 +
    netMatematik * 4.286 +
    netFen * 4.132 +
    netInkilap * 1.663 +
    netDin * 1.625 +
    netIngilizce * 1.553;

  // Max ağırlıklı puan (20*4.341 + 20*4.286 + 20*4.132 + 10*1.663 + 10*1.625 + 10*1.553) = 303.57
  const maxAgirlikli = 303.57;
  const rawScore = 100 + (agirlikliPuan / maxAgirlikli) * 400;
  const puan = Math.min(500, Math.max(100, Math.round(rawScore * 1000) / 1000));

  let yuzdelikDilim = "%40.0+";
  let tavsiyeOkullar = "Yerel yerleştirme ile öğrenci alan liseler";

  if (puan >= 488) {
    yuzdelikDilim = "%0.01 - %0.20";
    tavsiyeOkullar = "Galatasaray, Kabataş Erkek, İstanbul Erkek, Ankara Fen";
  } else if (puan >= 472) {
    yuzdelikDilim = "%0.21 - %1.10";
    tavsiyeOkullar = "Tüm Türkiye'nin en seçkin Fen Liseleri ve Köklü Anadolu Liseleri";
  } else if (puan >= 450) {
    yuzdelikDilim = "%1.11 - %3.50";
    tavsiyeOkullar = "Nitelikli İl Fen Liseleri ve Üst Segment Anadolu Liseleri";
  } else if (puan >= 420) {
    yuzdelikDilim = "%3.51 - %7.50";
    tavsiyeOkullar = "İlçe Fen Liseleri, Proje Anadolu ve Sosyal Bilimler Liseleri";
  } else if (puan >= 380) {
    yuzdelikDilim = "%7.51 - %14.00";
    tavsiyeOkullar = "Proje Anadolu Liseleri, Merkezi Sınavlı İmam Hatip ve MTAL";
  } else if (puan >= 340) {
    yuzdelikDilim = "%14.01 - %25.00";
    tavsiyeOkullar = "Sınavla alan Anadolu & Mesleki Teknik Anadolu Liseleri";
  } else if (puan >= 280) {
    yuzdelikDilim = "%25.01 - %45.00";
    tavsiyeOkullar = "Adrese dayalı Anadolu Liseleri ve Meslek Liseleri";
  }

  return {
    netler: {
      turkce: netTurkce,
      matematik: netMatematik,
      fen: netFen,
      inkilap: netInkilap,
      din: netDin,
      ingilizce: netIngilizce,
      toplamNet,
    },
    toplamDogru,
    toplamYanlis,
    toplamBos,
    puan,
    yuzdelikDilim,
    tavsiyeOkullar,
  };
}

// --- YKS (Yükseköğretim Kurumları Sınavı - TYT / AYT / YDT) ---

export type YksSubjectInput = {
  correct: number;
  wrong: number;
};

export type YksFormState = {
  diplomaNotu: number; // 50 - 100
  kirikObp: boolean; // Önceki yıl yerleşti
  tyt: {
    turkce: YksSubjectInput; // 40
    sosyal: YksSubjectInput; // 20
    matematik: YksSubjectInput; // 40
    fen: YksSubjectInput; // 20
  };
  ayt: {
    matematik: YksSubjectInput; // 40
    fizik: YksSubjectInput; // 14
    kimya: YksSubjectInput; // 13
    biyoloji: YksSubjectInput; // 13
    edebiyat: YksSubjectInput; // 24
    tarih1: YksSubjectInput; // 10
    cografya1: YksSubjectInput; // 6
    tarih2: YksSubjectInput; // 11
    cografya2: YksSubjectInput; // 11
    felsefe: YksSubjectInput; // 12
    din: YksSubjectInput; // 6
    ydt: YksSubjectInput; // 80
  };
};

export const DEFAULT_YKS_STATE: YksFormState = {
  diplomaNotu: 85,
  kirikObp: false,
  tyt: {
    turkce: { correct: 0, wrong: 0 },
    sosyal: { correct: 0, wrong: 0 },
    matematik: { correct: 0, wrong: 0 },
    fen: { correct: 0, wrong: 0 },
  },
  ayt: {
    matematik: { correct: 0, wrong: 0 },
    fizik: { correct: 0, wrong: 0 },
    kimya: { correct: 0, wrong: 0 },
    biyoloji: { correct: 0, wrong: 0 },
    edebiyat: { correct: 0, wrong: 0 },
    tarih1: { correct: 0, wrong: 0 },
    cografya1: { correct: 0, wrong: 0 },
    tarih2: { correct: 0, wrong: 0 },
    cografya2: { correct: 0, wrong: 0 },
    felsefe: { correct: 0, wrong: 0 },
    din: { correct: 0, wrong: 0 },
    ydt: { correct: 0, wrong: 0 },
  },
};

export function calcYksNet(correct: number, wrong: number, maxQuestions: number): number {
  const safeCorrect = Math.max(0, Math.min(maxQuestions, Number(correct) || 0));
  const safeWrong = Math.max(0, Math.min(maxQuestions - safeCorrect, Number(wrong) || 0));
  const net = safeCorrect - safeWrong / 4;
  return Math.max(0, Math.round(net * 100) / 100);
}

export type ScoreTier = {
  hamPuan: number;
  yerlestirmePuani: number;
  tahminiSiralama: string;
};

export type YksCalculationResult = {
  obpPuan: number;
  obpKatki: number;
  tyt: {
    turkceNet: number;
    sosyalNet: number;
    matematikNet: number;
    fenNet: number;
    toplamNet: number;
    hamPuan: number;
    yerlestirmePuani: number;
    tahminiSiralama: string;
  };
  say: ScoreTier;
  ea: ScoreTier;
  soz: ScoreTier;
  dil: ScoreTier;
};

export function calculateYksScore(state: YksFormState): YksCalculationResult {
  // TYT Netleri
  const tytTurkce = calcYksNet(state.tyt.turkce.correct, state.tyt.turkce.wrong, 40);
  const tytSosyal = calcYksNet(state.tyt.sosyal.correct, state.tyt.sosyal.wrong, 20);
  const tytMat = calcYksNet(state.tyt.matematik.correct, state.tyt.matematik.wrong, 40);
  const tytFen = calcYksNet(state.tyt.fen.correct, state.tyt.fen.wrong, 20);
  const tytToplamNet = Math.round((tytTurkce + tytSosyal + tytMat + tytFen) * 100) / 100;

  // AYT Netleri
  const aytMat = calcYksNet(state.ayt.matematik.correct, state.ayt.matematik.wrong, 40);
  const aytFizik = calcYksNet(state.ayt.fizik.correct, state.ayt.fizik.wrong, 14);
  const aytKimya = calcYksNet(state.ayt.kimya.correct, state.ayt.kimya.wrong, 13);
  const aytBiyoloji = calcYksNet(state.ayt.biyoloji.correct, state.ayt.biyoloji.wrong, 13);
  const aytFenToplam = Math.round((aytFizik + aytKimya + aytBiyoloji) * 100) / 100;

  const aytEdebiyat = calcYksNet(state.ayt.edebiyat.correct, state.ayt.edebiyat.wrong, 24);
  const aytTarih1 = calcYksNet(state.ayt.tarih1.correct, state.ayt.tarih1.wrong, 10);
  const aytCografya1 = calcYksNet(state.ayt.cografya1.correct, state.ayt.cografya1.wrong, 6);
  const aytSos1Toplam = Math.round((aytEdebiyat + aytTarih1 + aytCografya1) * 100) / 100;

  const aytTarih2 = calcYksNet(state.ayt.tarih2.correct, state.ayt.tarih2.wrong, 11);
  const aytCografya2 = calcYksNet(state.ayt.cografya2.correct, state.ayt.cografya2.wrong, 11);
  const aytFelsefe = calcYksNet(state.ayt.felsefe.correct, state.ayt.felsefe.wrong, 12);
  const aytDin = calcYksNet(state.ayt.din.correct, state.ayt.din.wrong, 6);
  const aytSos2Toplam = Math.round((aytTarih2 + aytCografya2 + aytFelsefe + aytDin) * 100) / 100;

  const ydtNet = calcYksNet(state.ayt.ydt.correct, state.ayt.ydt.wrong, 80);

  // OBP Hesabı (50-100 arası diploma notu -> 250-500 OBP -> %12 veya %6 yerleştirme katkısı)
  const safeDiplomaNotu = Math.min(100, Math.max(50, Number(state.diplomaNotu) || 50));
  const obpPuan = safeDiplomaNotu * 5;
  const katsayiObp = state.kirikObp ? 0.06 : 0.12;
  const obpKatki = Math.round(obpPuan * katsayiObp * 100) / 100;

  // TYT Puanı (ÖSYM Taban 100 + ağırlıklar)
  // Max 120 net = 500 ham puan
  const tytRaw = 100 + (tytTurkce * 3.3 + tytSosyal * 3.4 + tytMat * 3.3 + tytFen * 3.4);
  const tytHamPuan = Math.min(500, Math.max(100, Math.round(tytRaw * 100) / 100));
  const tytYerlestirme = Math.round((tytHamPuan + obpKatki) * 100) / 100;

  // SAYISAL: TYT (%40) + AYT Mat (40 soru) + AYT Fen (40 soru)
  const sayRaw = 100 + tytToplamNet * 1.32 + aytMat * 3.0 + aytFenToplam * 2.85;
  const sayHam = Math.min(500, Math.max(100, Math.round(sayRaw * 100) / 100));
  const sayYerlestirme = Math.round((sayHam + obpKatki) * 100) / 100;

  // EŞİT AĞIRLIK: TYT (%40) + AYT Mat (40) + Sos-1 (40)
  const eaRaw = 100 + tytToplamNet * 1.32 + aytMat * 3.0 + aytSos1Toplam * 2.95;
  const eaHam = Math.min(500, Math.max(100, Math.round(eaRaw * 100) / 100));
  const eaYerlestirme = Math.round((eaHam + obpKatki) * 100) / 100;

  // SÖZEL: TYT (%40) + Sos-1 (40) + Sos-2 (40)
  const sozRaw = 100 + tytToplamNet * 1.32 + aytSos1Toplam * 2.95 + aytSos2Toplam * 2.95;
  const sozHam = Math.min(500, Math.max(100, Math.round(sozRaw * 100) / 100));
  const sozYerlestirme = Math.round((sozHam + obpKatki) * 100) / 100;

  // DİL (YDT): TYT (%40) + YDT (80)
  const dilRaw = 100 + tytToplamNet * 1.32 + ydtNet * 3.0;
  const dilHam = Math.min(500, Math.max(100, Math.round(dilRaw * 100) / 100));
  const dilYerlestirme = Math.round((dilHam + obpKatki) * 100) / 100;

  return {
    obpPuan,
    obpKatki,
    tyt: {
      turkceNet: tytTurkce,
      sosyalNet: tytSosyal,
      matematikNet: tytMat,
      fenNet: tytFen,
      toplamNet: tytToplamNet,
      hamPuan: tytHamPuan,
      yerlestirmePuani: tytYerlestirme,
      tahminiSiralama: resolveTytSiralama(tytYerlestirme),
    },
    say: {
      hamPuan: sayHam,
      yerlestirmePuani: sayYerlestirme,
      tahminiSiralama: resolveSaySiralama(sayYerlestirme),
    },
    ea: {
      hamPuan: eaHam,
      yerlestirmePuani: eaYerlestirme,
      tahminiSiralama: resolveEaSiralama(eaYerlestirme),
    },
    soz: {
      hamPuan: sozHam,
      yerlestirmePuani: sozYerlestirme,
      tahminiSiralama: resolveSozSiralama(sozYerlestirme),
    },
    dil: {
      hamPuan: dilHam,
      yerlestirmePuani: dilYerlestirme,
      tahminiSiralama: resolveDilSiralama(dilYerlestirme),
    },
  };
}

function resolveTytSiralama(p: number): string {
  if (p >= 510) return "İlk 5.000";
  if (p >= 460) return "5.000 - 35.000";
  if (p >= 400) return "35.000 - 120.000";
  if (p >= 340) return "120.000 - 300.000";
  if (p >= 270) return "300.000 - 750.000";
  return "750.000+";
}

function resolveSaySiralama(p: number): string {
  if (p >= 520) return "İlk 2.500 (Tıp & Tepe Müh.)";
  if (p >= 480) return "2.500 - 20.000 (Tıp & İyi Müh.)";
  if (p >= 430) return "20.000 - 60.000 (Mühendislik & Diş)";
  if (p >= 370) return "60.000 - 140.000 (Mühendislik & Mimarlık)";
  if (p >= 300) return "140.000 - 300.000";
  return "300.000+";
}

function resolveEaSiralama(p: number): string {
  if (p >= 490) return "İlk 2.000 (Hukuk & İktisat Tepe)";
  if (p >= 440) return "2.000 - 25.000 (Hukuk & Psikoloji)";
  if (p >= 380) return "25.000 - 90.000 (İşletme & YBS)";
  if (p >= 310) return "90.000 - 250.000";
  return "250.000+";
}

function resolveSozSiralama(p: number): string {
  if (p >= 470) return "İlk 1.500 (Özel Eğitim & İletişim)";
  if (p >= 410) return "1.500 - 15.000 (Tarih & Edebiyat)";
  if (p >= 350) return "15.000 - 70.000";
  return "70.000+";
}

function resolveDilSiralama(p: number): string {
  if (p >= 480) return "İlk 1.500 (Mütercim & İng. Öğrt.)";
  if (p >= 420) return "1.500 - 12.000 (İngiliz Dili)";
  if (p >= 350) return "12.000 - 40.000";
  return "40.000+";
}
