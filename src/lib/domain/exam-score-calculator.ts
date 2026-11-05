/**
 * Zigo LGS ve YKS Puan Hesaplama Motoru
 * MEB ve ÖSYM resmi kılavuzları, standart sapma formülleri ve güncel katsayılarına göre çalışır.
 */

// ============================================================================
// 1. LGS (LİSELERE GEÇİŞ SİSTEMİ) HESAPLAMA MOTORU
// ============================================================================

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

export const DEFAULT_LGS_STATE: LgsFormState = {
  turkce: { correct: 0, wrong: 0 },
  matematik: { correct: 0, wrong: 0 },
  fen: { correct: 0, wrong: 0 },
  inkilap: { correct: 0, wrong: 0 },
  din: { correct: 0, wrong: 0 },
  ingilizce: { correct: 0, wrong: 0 },
};

/**
 * MEB LGS Resmi Türkiye Ortalamaları ve Standart Sapma Parametreleri
 * Kaynak: MEB Merkezi Sınav İstatistik ve Değerlendirme Raporu
 */
export const LGS_TEST_PARAMS = {
  turkce: { soru: 20, katsayi: 4, ortalama: 9.85, ss: 5.25 },
  matematik: { soru: 20, katsayi: 4, ortalama: 5.20, ss: 4.40 },
  fen: { soru: 20, katsayi: 4, ortalama: 8.90, ss: 5.15 },
  inkilap: { soru: 10, katsayi: 1, ortalama: 6.40, ss: 2.85 },
  din: { soru: 10, katsayi: 1, ortalama: 6.60, ss: 2.65 },
  ingilizce: { soru: 10, katsayi: 1, ortalama: 4.80, ss: 3.35 },
} as const;

export function calcLgsNet(correct: number, wrong: number, maxQuestions: number): number {
  const safeCorrect = Math.max(0, Math.min(maxQuestions, Number(correct) || 0));
  const safeWrong = Math.max(0, Math.min(maxQuestions - safeCorrect, Number(wrong) || 0));
  const net = safeCorrect - safeWrong / 3;
  return Math.max(0, Math.round(net * 100) / 100);
}

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
  puan: number; // 100.000 - 500.000
  yuzdelikDilim: string; // Örn: "%0.01 - %0.20"
  ilYuzdelikDilim: string;
  tavsiyeOkullar: string;
  hedefYorumu: string;
};

/**
 * MEB Resmi LGS Standart Puan (SP) & Ağırlıklı Standart Puan (ASP) Algoritması:
 * SP = 50 + 10 * ((HamNet - Ortalama) / StandartSapma)
 * ASP = SP * Ağırlık Katsayısı
 * TASP = Sum(ASP)
 * MSP = 100 + 400 * ((TASP - EnKucukTASP) / (EnBuyukTASP - EnKucukTASP))
 */
export function calculateLgsScore(state: LgsFormState): LgsCalculationResult {
  const netTurkce = calcLgsNet(state.turkce.correct, state.turkce.wrong, 20);
  const netMat = calcLgsNet(state.matematik.correct, state.matematik.wrong, 20);
  const netFen = calcLgsNet(state.fen.correct, state.fen.wrong, 20);
  const netInk = calcLgsNet(state.inkilap.correct, state.inkilap.wrong, 10);
  const netDin = calcLgsNet(state.din.correct, state.din.wrong, 10);
  const netIng = calcLgsNet(state.ingilizce.correct, state.ingilizce.wrong, 10);

  const toplamNet = Math.round((netTurkce + netMat + netFen + netInk + netDin + netIng) * 100) / 100;

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

  // Her alt test için standart puan (SP) hesabı
  const spTurkce = 50 + 10 * ((netTurkce - LGS_TEST_PARAMS.turkce.ortalama) / LGS_TEST_PARAMS.turkce.ss);
  const spMat = 50 + 10 * ((netMat - LGS_TEST_PARAMS.matematik.ortalama) / LGS_TEST_PARAMS.matematik.ss);
  const spFen = 50 + 10 * ((netFen - LGS_TEST_PARAMS.fen.ortalama) / LGS_TEST_PARAMS.fen.ss);
  const spInk = 50 + 10 * ((netInk - LGS_TEST_PARAMS.inkilap.ortalama) / LGS_TEST_PARAMS.inkilap.ss);
  const spDin = 50 + 10 * ((netDin - LGS_TEST_PARAMS.din.ortalama) / LGS_TEST_PARAMS.din.ss);
  const spIng = 50 + 10 * ((netIng - LGS_TEST_PARAMS.ingilizce.ortalama) / LGS_TEST_PARAMS.ingilizce.ss);

  // Ağırlıklı Standart Puan Toplamı (TASP)
  const tasp =
    spTurkce * LGS_TEST_PARAMS.turkce.katsayi +
    spMat * LGS_TEST_PARAMS.matematik.katsayi +
    spFen * LGS_TEST_PARAMS.fen.katsayi +
    spInk * LGS_TEST_PARAMS.inkilap.katsayi +
    spDin * LGS_TEST_PARAMS.din.katsayi +
    spIng * LGS_TEST_PARAMS.ingilizce.katsayi;

  // En küçük ve en büyük olası TASP (Tüm netler 0 vs Tüm netler 90 tam)
  const minTasp =
    (50 + 10 * (-LGS_TEST_PARAMS.turkce.ortalama / LGS_TEST_PARAMS.turkce.ss)) * 4 +
    (50 + 10 * (-LGS_TEST_PARAMS.matematik.ortalama / LGS_TEST_PARAMS.matematik.ss)) * 4 +
    (50 + 10 * (-LGS_TEST_PARAMS.fen.ortalama / LGS_TEST_PARAMS.fen.ss)) * 4 +
    (50 + 10 * (-LGS_TEST_PARAMS.inkilap.ortalama / LGS_TEST_PARAMS.inkilap.ss)) * 1 +
    (50 + 10 * (-LGS_TEST_PARAMS.din.ortalama / LGS_TEST_PARAMS.din.ss)) * 1 +
    (50 + 10 * (-LGS_TEST_PARAMS.ingilizce.ortalama / LGS_TEST_PARAMS.ingilizce.ss)) * 1;

  const maxTasp =
    (50 + 10 * ((20 - LGS_TEST_PARAMS.turkce.ortalama) / LGS_TEST_PARAMS.turkce.ss)) * 4 +
    (50 + 10 * ((20 - LGS_TEST_PARAMS.matematik.ortalama) / LGS_TEST_PARAMS.matematik.ss)) * 4 +
    (50 + 10 * ((20 - LGS_TEST_PARAMS.fen.ortalama) / LGS_TEST_PARAMS.fen.ss)) * 4 +
    (50 + 10 * ((10 - LGS_TEST_PARAMS.inkilap.ortalama) / LGS_TEST_PARAMS.inkilap.ss)) * 1 +
    (50 + 10 * ((10 - LGS_TEST_PARAMS.din.ortalama) / LGS_TEST_PARAMS.din.ss)) * 1 +
    (50 + 10 * ((10 - LGS_TEST_PARAMS.ingilizce.ortalama) / LGS_TEST_PARAMS.ingilizce.ss)) * 1;

  // MEB Formülü ile Merkezi Sınav Puanı
  let msp = 100 + 400 * ((tasp - minTasp) / (maxTasp - minTasp));
  if (toplamNet === 0) msp = 100;
  if (toplamNet >= 90) msp = 500;
  const puan = Math.min(500, Math.max(100, Math.round(msp * 1000) / 1000));

  // Gerçek LGS Yüzdelik Dilim ve Okul Hedefleme Modeli
  let yuzdelikDilim = "%40+";
  let ilYuzdelikDilim = "%45+";
  let tavsiyeOkullar = "Yerel yerleştirme ile öğrenci alan liseler";
  let hedefYorumu = "Kayıt alanındaki liseler için tercih yapılabilir.";

  if (puan >= 488) {
    yuzdelikDilim = "%0.01 - %0.15";
    ilYuzdelikDilim = "%0.01 - %0.10";
    tavsiyeOkullar = "Galatasaray, Kabataş Erkek, İstanbul Erkek, Ankara Fen";
    hedefYorumu = "Türkiye'nin en üst %0.1'lik zirve fen ve proje liseleri.";
  } else if (puan >= 472) {
    yuzdelikDilim = "%0.16 - %1.00";
    ilYuzdelikDilim = "%0.15 - %0.85";
    tavsiyeOkullar = "Tüm Türkiye'nin en saygın Fen ve Köklü Anadolu Liseleri";
    hedefYorumu = "İl merkezi fen liseleri ve köklü anadolu liseleri için çok güçlü puan.";
  } else if (puan >= 450) {
    yuzdelikDilim = "%1.01 - %3.50";
    ilYuzdelikDilim = "%0.90 - %3.00";
    tavsiyeOkullar = "Nitelikli Fen Liseleri ve Üst Segment Anadolu Liseleri";
    hedefYorumu = "Büyükşehirlerdeki önde gelen anadolu liseleri ve ilçe fen liseleri.";
  } else if (puan >= 420) {
    yuzdelikDilim = "%3.51 - %7.50";
    ilYuzdelikDilim = "%3.01 - %6.80";
    tavsiyeOkullar = "İlçe Fen Liseleri, Proje Anadolu ve Sosyal Bilimler Liseleri";
    hedefYorumu = "Yüksek puanlı proje anadolu liseleri ve sosyal bilimler liseleri.";
  } else if (puan >= 380) {
    yuzdelikDilim = "%7.51 - %14.00";
    ilYuzdelikDilim = "%6.81 - %12.50";
    tavsiyeOkullar = "Proje Anadolu Liseleri, Merkezi Sınavlı İmam Hatip ve MTAL";
    hedefYorumu = "Merkezi sınav puanıyla öğrenci alan anadolu ve mesleki teknik liseler.";
  } else if (puan >= 330) {
    yuzdelikDilim = "%14.01 - %25.00";
    ilYuzdelikDilim = "%12.51 - %22.00";
    tavsiyeOkullar = "Sınavla alan Anadolu & Mesleki Teknik Anadolu Liseleri";
    hedefYorumu = "Merkezi ve yerel kontenjanlı liseler hedeflenebilir.";
  } else if (puan >= 270) {
    yuzdelikDilim = "%25.01 - %40.00";
    ilYuzdelikDilim = "%22.01 - %36.00";
    tavsiyeOkullar = "Adrese dayalı Anadolu Liseleri ve Mesleki Teknik Liseleri";
    hedefYorumu = "OBP ve adrese dayalı tercihler ağırlıklı değerlendirilmelidir.";
  }

  return {
    netler: {
      turkce: netTurkce,
      matematik: netMat,
      fen: netFen,
      inkilap: netInk,
      din: netDin,
      ingilizce: netIng,
      toplamNet,
    },
    toplamDogru,
    toplamYanlis,
    toplamBos,
    puan,
    yuzdelikDilim,
    ilYuzdelikDilim,
    tavsiyeOkullar,
    hedefYorumu,
  };
}

// ============================================================================
// 2. YKS (TYT - AYT - YDT) HESAPLAMA MOTORU
// ============================================================================

export type YksSubjectInput = {
  correct: number;
  wrong: number;
};

export type YksFormState = {
  diplomaNotu: number; // 50 - 100
  kirikObp: boolean; // Önceki yıl bir bölüme yerleşti
  meslekLisesiEkPuan: boolean; // Meslek lisesi kendi alanını seçerse ek puan (+0.06)
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
  meslekLisesiEkPuan: false,
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
  isCalculable: boolean;
  uncalculatedReason?: string;
  hamPuan: number;
  yerlestirmePuani: number;
  ekPuanliYerlestirme?: number;
  tahminiSiralama: string;
  ornekBolumler: string;
};

export type YksCalculationResult = {
  obpPuan: number;
  obpKatki: number;
  ekPuanKatki: number;
  meslekLisesiKatki: number;
  tyt: ScoreTier & {
    turkceNet: number;
    sosyalNet: number;
    matematikNet: number;
    fenNet: number;
    toplamNet: number;
  };
  say: ScoreTier;
  ea: ScoreTier;
  soz: ScoreTier;
  dil: ScoreTier;
};

/**
 * ÖSYM Resmi YKS Katsayıları:
 * TYT Ham: 100 Taban + (Türkçe*3.30 + Mat*3.30 + Sosyal*3.40 + Fen*3.40)
 * YKS Ham Puanlarında:
 * TYT Ağırlığı: %40 (Her TYT neti ~1.32 puan ekler)
 * AYT Ağırlığı: %60 (Her AYT neti ~3.00 puan ekler)
 * 0.5 Net Kuralı: TYT Türkçe veya Mat'tan en az 0.5 net yapılmalıdır.
 */
export function calculateYksScore(state: YksFormState): YksCalculationResult {
  // TYT Netleri
  const tytTurkce = calcYksNet(state.tyt.turkce.correct, state.tyt.turkce.wrong, 40);
  const tytSosyal = calcYksNet(state.tyt.sosyal.correct, state.tyt.sosyal.wrong, 20);
  const tytMat = calcYksNet(state.tyt.matematik.correct, state.tyt.matematik.wrong, 40);
  const tytFen = calcYksNet(state.tyt.fen.correct, state.tyt.fen.wrong, 20);
  const tytToplamNet = Math.round((tytTurkce + tytSosyal + tytMat + tytFen) * 100) / 100;

  // ÖSYM 0.5 Net Kuralı: Türkçe veya Temel Matematikten en az 0.5 net şartı
  const tytHas05Net = tytTurkce >= 0.5 || tytMat >= 0.5;

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

  // OBP Hesabı (Diploma notu 50 - 100 arası -> OBP 250 - 500)
  const safeDiplomaNotu = Math.min(100, Math.max(50, Number(state.diplomaNotu) || 50));
  const obpPuan = safeDiplomaNotu * 5;
  const katsayiObp = state.kirikObp ? 0.06 : 0.12;
  const obpKatki = Math.round(obpPuan * katsayiObp * 100) / 100;
  const ekPuanKatki = state.meslekLisesiEkPuan ? Math.round(obpPuan * 0.06 * 100) / 100 : 0;

  // 1. TYT Puanı
  let tytHamPuan = 100;
  let tytYerlestirme = 100;
  let tytCalculable = true;
  let tytReason: string | undefined;

  if (tytToplamNet > 0 && !tytHas05Net) {
    tytCalculable = false;
    tytReason = "ÖSYM 0.5 net kuralı: TYT puanının hesaplanması için Türkçe veya Temel Matematikten en az 0.5 net yapılmalıdır.";
  } else {
    const tytRaw = 100 + (tytTurkce * 3.3 + tytSosyal * 3.4 + tytMat * 3.3 + tytFen * 3.4);
    tytHamPuan = Math.min(500, Math.max(100, Math.round(tytRaw * 100) / 100));
    tytYerlestirme = Math.round((tytHamPuan + obpKatki) * 100) / 100;
  }

  // TYT Katkısı (%40 Ağırlık -> Tam net 160 puan getirir)
  const tytKatkisi = tytTurkce * 1.32 + tytMat * 1.32 + tytSosyal * 1.36 + tytFen * 1.36;

  // 2. SAYISAL (SAY): TYT (%40) + AYT Mat (30%) + AYT Fen (30%)
  const sayHas05 = aytMat >= 0.5 || aytFenToplam >= 0.5;
  const sayCalculable = tytCalculable && sayHas05;
  const sayRaw = 100 + tytKatkisi + aytMat * 3.0 + aytFenToplam * 3.0;
  const sayHam = Math.min(500, Math.max(100, Math.round(sayRaw * 100) / 100));
  const sayYerlestirme = Math.round((sayHam + obpKatki) * 100) / 100;
  const sayEkPuan = Math.round((sayYerlestirme + ekPuanKatki) * 100) / 100;

  // 3. EŞİT AĞIRLIK (EA): TYT (%40) + AYT Mat (30%) + AYT Edebiyat-Sos-1 (30%)
  const eaHas05 = aytMat >= 0.5 || aytSos1Toplam >= 0.5;
  const eaCalculable = tytCalculable && eaHas05;
  const eaRaw = 100 + tytKatkisi + aytMat * 3.0 + aytSos1Toplam * 3.0;
  const eaHam = Math.min(500, Math.max(100, Math.round(eaRaw * 100) / 100));
  const eaYerlestirme = Math.round((eaHam + obpKatki) * 100) / 100;
  const eaEkPuan = Math.round((eaYerlestirme + ekPuanKatki) * 100) / 100;

  // 4. SÖZEL (SÖZ): TYT (%40) + AYT Sos-1 (30%) + AYT Sos-2 (30%)
  const sozHas05 = aytSos1Toplam >= 0.5 || aytSos2Toplam >= 0.5;
  const sozCalculable = tytCalculable && sozHas05;
  const sozRaw = 100 + tytKatkisi + aytSos1Toplam * 3.0 + aytSos2Toplam * 3.0;
  const sozHam = Math.min(500, Math.max(100, Math.round(sozRaw * 100) / 100));
  const sozYerlestirme = Math.round((sozHam + obpKatki) * 100) / 100;
  const sozEkPuan = Math.round((sozYerlestirme + ekPuanKatki) * 100) / 100;

  // 5. DİL (YDT): TYT (%40) + YDT (60%)
  const dilHas05 = ydtNet >= 0.5;
  const dilCalculable = tytCalculable && dilHas05;
  const dilRaw = 100 + tytKatkisi + ydtNet * 3.0;
  const dilHam = Math.min(500, Math.max(100, Math.round(dilRaw * 100) / 100));
  const dilYerlestirme = Math.round((dilHam + obpKatki) * 100) / 100;
  const dilEkPuan = Math.round((dilYerlestirme + ekPuanKatki) * 100) / 100;

  return {
    obpPuan,
    obpKatki,
    ekPuanKatki,
    meslekLisesiKatki: ekPuanKatki,
    tyt: {
      isCalculable: tytCalculable,
      uncalculatedReason: tytReason,
      turkceNet: tytTurkce,
      sosyalNet: tytSosyal,
      matematikNet: tytMat,
      fenNet: tytFen,
      toplamNet: tytToplamNet,
      hamPuan: tytHamPuan,
      yerlestirmePuani: tytYerlestirme,
      ekPuanliYerlestirme: state.meslekLisesiEkPuan ? Math.round((tytYerlestirme + ekPuanKatki) * 100) / 100 : undefined,
      tahminiSiralama: resolveTytSiralama(tytYerlestirme),
      ornekBolumler: resolveTytBolumler(tytYerlestirme),
    },
    say: {
      isCalculable: sayCalculable,
      uncalculatedReason: !sayCalculable
        ? !tytCalculable
          ? "TYT puanı hesaplanamadığı için AYT Sayısal puanı da hesaplanamaz."
          : "AYT Matematik veya Fen testinden en az 0.5 net yapılmalıdır."
        : undefined,
      hamPuan: sayHam,
      yerlestirmePuani: sayYerlestirme,
      ekPuanliYerlestirme: state.meslekLisesiEkPuan ? sayEkPuan : undefined,
      tahminiSiralama: resolveSaySiralama(sayYerlestirme),
      ornekBolumler: resolveSayBolumler(sayYerlestirme),
    },
    ea: {
      isCalculable: eaCalculable,
      uncalculatedReason: !eaCalculable
        ? !tytCalculable
          ? "TYT puanı hesaplanamadığı için AYT Eşit Ağırlık puanı da hesaplanamaz."
          : "AYT Matematik veya Edebiyat-Sosyal-1 testinden en az 0.5 net yapılmalıdır."
        : undefined,
      hamPuan: eaHam,
      yerlestirmePuani: eaYerlestirme,
      ekPuanliYerlestirme: state.meslekLisesiEkPuan ? eaEkPuan : undefined,
      tahminiSiralama: resolveEaSiralama(eaYerlestirme),
      ornekBolumler: resolveEaBolumler(eaYerlestirme),
    },
    soz: {
      isCalculable: sozCalculable,
      uncalculatedReason: !sozCalculable
        ? !tytCalculable
          ? "TYT puanı hesaplanamadığı için AYT Sözel puanı da hesaplanamaz."
          : "AYT Edebiyat-Sosyal-1 veya Sosyal-2 testinden en az 0.5 net yapılmalıdır."
        : undefined,
      hamPuan: sozHam,
      yerlestirmePuani: sozYerlestirme,
      ekPuanliYerlestirme: state.meslekLisesiEkPuan ? sozEkPuan : undefined,
      tahminiSiralama: resolveSozSiralama(sozYerlestirme),
      ornekBolumler: resolveSozBolumler(sozYerlestirme),
    },
    dil: {
      isCalculable: dilCalculable,
      uncalculatedReason: !dilCalculable
        ? !tytCalculable
          ? "TYT puanı hesaplanamadığı için YDT Yabancı Dil puanı da hesaplanamaz."
          : "YDT Yabancı Dil testinden en az 0.5 net yapılmalıdır."
        : undefined,
      hamPuan: dilHam,
      yerlestirmePuani: dilYerlestirme,
      ekPuanliYerlestirme: state.meslekLisesiEkPuan ? dilEkPuan : undefined,
      tahminiSiralama: resolveDilSiralama(dilYerlestirme),
      ornekBolumler: resolveDilBolumler(dilYerlestirme),
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

function resolveTytBolumler(p: number): string {
  if (p >= 450) return "Tüm Popüler Sağlık & Bilişim Önlisans Programları, PMYO Tepe, Deniz Ulaştırma";
  if (p >= 380) return "İlk ve Acil Yardım (Paramedik), Anestezi, Bilgisayar Programcılığı, Ağız ve Diş Sağlığı";
  if (p >= 320) return "Tıbbi Görüntüleme, Adalet, Bilişim Güvenliği, Dış Ticaret, Grafik Tasarımı";
  if (p >= 260) return "Bankacılık, Muhasebe, Lojistik, Turizm, Elektrik, Makine, İnşaat Önlisans";
  return "2 Yıllık Önlisans Programları ve Özel Yetenek ile Alan Lisans Bölümleri";
}

function resolveSaySiralama(p: number): string {
  if (p >= 520) return "İlk 2.500";
  if (p >= 480) return "2.500 - 20.000";
  if (p >= 430) return "20.000 - 60.000";
  if (p >= 370) return "60.000 - 140.000";
  if (p >= 300) return "140.000 - 300.000";
  return "300.000+";
}

function resolveSayBolumler(p: number): string {
  if (p >= 520) return "Tıp (Hacettepe/Cerrahpaşa), ODTÜ & Boğaziçi Bilgisayar/Elektrik Müh.";
  if (p >= 480) return "Devlet Tıp Fakülteleri, İTÜ & ODTÜ Mühendislikleri, Diş Hekimliği";
  if (p >= 430) return "Mühendislikler (Makine, Endüstri, Yazılım), Eczacılık, Mimarlık";
  if (p >= 370) return "Devlet ve Vakıf Mühendislikleri, Hemşirelik, Fizyoterapi, FKB";
  if (p >= 300) return "Sayısal Lisans Programları, Sağlık Bilimleri, Ziraat, Orman";
  return "Temel Bilimler ve İlgili Lisans/Önlisans Programları";
}

function resolveEaSiralama(p: number): string {
  if (p >= 490) return "İlk 2.000";
  if (p >= 440) return "2.000 - 25.000";
  if (p >= 380) return "25.000 - 90.000";
  if (p >= 310) return "90.000 - 250.000";
  return "250.000+";
}

function resolveEaBolumler(p: number): string {
  if (p >= 490) return "Galatasaray & Boğaziçi Hukuk / İktisat / İşletme, ODTÜ İİBF";
  if (p >= 440) return "Devlet Hukuk Fakülteleri, Psikoloji, Yönetim Bilişim Sistemleri (YBS)";
  if (p >= 380) return "PDR, Siyaset Bilimi, İktisat, İşletme, Maliye, Uluslararası İlişkiler";
  if (p >= 310) return "Sınıf Öğretmenliği, Çocuk Gelişimi, Sosyoloji, Lojistik Yönetimi";
  return "Eşit Ağırlık Lisans ve İlgili Bölümler";
}

function resolveSozSiralama(p: number): string {
  if (p >= 470) return "İlk 1.500";
  if (p >= 410) return "1.500 - 15.000";
  if (p >= 350) return "15.000 - 70.000";
  return "70.000+";
}

function resolveSozBolumler(p: number): string {
  if (p >= 470) return "Özel Eğitim Öğretmenliği (Boğaziçi/Hacettepe), Gastronomi Tepe";
  if (p >= 410) return "Türkçe Öğretmenliği, İlahiyat / İslami İlimler, Radyo-TV-Sinema";
  if (p >= 350) return "Halkla İlişkiler, Tarih, Coğrafya, Gazetecilik, Görsel İletişim";
  return "Sözel Lisans Programları";
}

function resolveDilSiralama(p: number): string {
  if (p >= 480) return "İlk 1.500";
  if (p >= 420) return "1.500 - 12.000";
  if (p >= 350) return "12.000 - 40.000";
  return "40.000+";
}

function resolveDilBolumler(p: number): string {
  if (p >= 480) return "Mütercim Tercümanlık (Boğaziçi/Hacettepe), İngilizce Öğretmenliği";
  if (p >= 420) return "İngiliz Dili ve Edebiyatı, Amerikan Kültürü, Turizm Rehberliği";
  if (p >= 350) return "Almanca/Fransızca Öğretmenliği, Karşılaştırmalı Edebiyat";
  return "Yabancı Dil Lisans Programları";
}
