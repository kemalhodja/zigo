export type ExamKey = "lgs" | "yks";

export type TopicQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
};

export type CurriculumTopic = {
  exam: ExamKey;
  examLabel: string;
  subjectSlug: string;
  subjectName: string;
  topicSlug: string;
  title: string;
  shortDesc: string;
  avgQuestions: string;
  difficulty: "Temel" | "Orta" | "İleri";
  studyMinutes: number;
  keyPoints: string[];
  commonMistakes: string[];
  strategyTip: string;
  questions: TopicQuestion[];
};

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  // ─── LGS MATEMATİK ────────────────────────────────────────────────────────
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "carpanlar-ve-katlar",
    title: "Çarpanlar ve Katlar (EBOB - EKOK)",
    shortDesc:
      "Asal çarpanlara ayırma, EBOB ve EKOK problemleri, aralarında asal sayılar ve LGS yeni nesil soru çözüm stratejileri.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Bir pozitif tam sayının kendisi hariç en büyük çarpanı, sayının en küçük asal çarpanına bölümüyle bulunur.",
      "İki sayının çarpımı, bu iki sayının EBOB'u ile EKOK'unun çarpımına eşittir: A × B = EBOB(A,B) × EKOK(A,B).",
      "1 ile tüm pozitif tam sayılar aralarında asaldır; ardışık iki pozitif tam sayı her zaman aralarında asaldır.",
      "Aralarında asal sayıların EBOB'u 1, EKOK'u ise sayıların çarpımına eşittir.",
    ],
    commonMistakes: [
      "Büyük parçalardan küçük eş parçalar oluştururken EKOK kullanmak (parçalama = EBOB, birleştirme = EKOK).",
      "EBOB-EKOK problemlerinde 'en az' kelimesini görünce her zaman EKOK seçmek.",
      "1 sayısını asal sayı olarak kabul etmek (en küçük asal sayı 2'dir).",
    ],
    strategyTip:
      "Yeni nesil sorularda verilen şekli kenar uzunluklarına ayırıp 'bütün mü parçalanıyor, parçalar mı birleşiyor?' sorusunu sorarak EBOB/EKOK ayrımını saniyeler içinde yap.",
    questions: [
      {
        question: "Aralarında asal iki sayının EKOK'u 72'dir. Bu sayılardan biri 8 olduğuna göre diğer sayı kaçtır?",
        options: ["6", "9", "12", "18"],
        correctIndex: 1,
        explanation:
          "Aralarında asal sayıların EKOK'u sayıların çarpımına eşittir. 8 × x = 72 olduğundan x = 9 bulunur. 8 ve 9 ardışık olduğu için aralarında asaldır.",
      },
      {
        question: "48 cm ve 60 cm uzunluğundaki iki demir çubuk hiç artmayacak şekilde eşit uzunlukta en büyük parçalara ayrılıyor. En az kaç parça elde edilir?",
        options: ["7", "9", "11", "12"],
        correctIndex: 1,
        explanation:
          "EBOB(48, 60) = 12 cm olur. 48 / 12 = 4 parça, 60 / 12 = 5 parça. Toplam 4 + 5 = 9 parça elde edilir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "uslu-ifadeler",
    title: "Üslü İfadeler ve Bilimsel Gösterim",
    shortDesc:
      "Negatif üs, üssün üssü, üslü sayılarda çarpma-bölme kuralları, 10'un kuvvetleri ve bilimsel gösterim.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Orta",
    studyMinutes: 50,
    keyPoints: [
      "Sıfır hariç her sayının 0. kuvveti 1'dir: a⁰ = 1 (a ≠ 0).",
      "Negatif üs sayının işaretini değiştirmez, sayıyı çarpmaya göre ters çevirir: a⁻ⁿ = 1 / aⁿ.",
      "Tabanlar aynıysa çarpma işleminde üsler toplanır, bölme işleminde payın üssünden paydanın üssü çıkarılır.",
      "Bilimsel gösterim: a × 10ⁿ biçiminde yazılır ve 1 ≤ |a| < 10 şartını sağlamalıdır.",
    ],
    commonMistakes: [
      "(-2)⁴ ile -2⁴ ifadelerini karıştırmak: (-2)⁴ = +16 iken, -2⁴ = -16'dır.",
      "2⁻³ ifadesini -8 olarak hesaplamak (doğrusu 1/8'dir).",
      "Bilimsel gösterimde katsayıyı 10 veya 0,5 bırakmak (1 ile 10 aralığında olmalı).",
    ],
    strategyTip:
      "LGS sorularında verilen tüm tabanları (4, 8, 16, 9, 27, 25 vb.) sorunun başında en küçük asal tabana (2, 3, 5) dönüştürmek işlem hatasını %80 azaltır.",
    questions: [
      {
        question: "8⁴ sayısının yarısı aşağıdakilerden hangisine eşittir?",
        options: ["4⁴", "2¹¹", "2¹²", "4⁶"],
        correctIndex: 1,
        explanation: "8⁴ = (2³)⁴ = 2¹². Yarısı 2¹² / 2¹ = 2¹¹ olur.",
      },
      {
        question: "0,00045 × 10⁷ sayısının bilimsel gösterimi hangisidir?",
        options: ["4,5 × 10³", "45 × 10²", "4,5 × 10⁴", "0,45 × 10⁴"],
        correctIndex: 0,
        explanation: "0,00045 = 4,5 × 10⁻⁴. 4,5 × 10⁻⁴ × 10⁷ = 4,5 × 10³ olur.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "karekoklu-ifadeler",
    title: "Kareköklü İfadeler ve Gerçek Sayılar",
    shortDesc:
      "Tam kare sayılar, a√b biçiminde yazma, kareköklü sayılarda dört işlem ve yaklaşık değer tahmini.",
    avgQuestions: "3 Soru",
    difficulty: "Orta",
    studyMinutes: 55,
    keyPoints: [
      "Kök dışına çıkarma: √(a²·b) = a√b (a ≥ 0).",
      "Kareköklü sayılarda toplama ve çıkarma yapabilmek için kök içindeki sayıların eşit olması gerekir.",
      "Çarpma işleminde katsayılar kendi arasında, kök içleri kendi arasında çarpılır.",
      "Devirli ondalık sayılar dahil kesir olarak yazılabilen tüm sayılar rasyonel (Q), π ve kök dışına tam çıkamayanlar irrasyoneldir (I).",
    ],
    commonMistakes: [
      "√9 + √16 işlemini √25 = 5 sanmak (doğrusu 3 + 4 = 7'dir).",
      "Yaklaşık değer sorularında sayının hangi iki tam kare sayı arasında olduğunu kontrol etmemek.",
    ],
    strategyTip:
      "1'den 25'e kadar olan tam kare sayıları (1, 4, 9, ..., 625) ezbere bilmek hem yaklaşık değer hem de alan-kenar ilişkisi sorularında büyük hız kazandırır.",
    questions: [
      {
        question: "√75 + √12 - √27 işleminin sonucu kaçtır?",
        options: ["2√3", "4√3", "5√3", "6√3"],
        correctIndex: 1,
        explanation: "√75 = 5√3, √12 = 2√3, √27 = 3√3. Sonuç: 5√3 + 2√3 - 3√3 = 4√3.",
      },
      {
        question: "√42 sayısı hangi iki ardışık tam sayı arasındadır?",
        options: ["5 ile 6", "6 ile 7", "7 ile 8", "8 ile 9"],
        correctIndex: 1,
        explanation: "√36 < √42 < √49 olduğundan 6 ile 7 arasındadır ve 6'ya daha yakındır.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "veri-analizi",
    title: "Veri Analizi (Daire, Sütun ve Çizgi Grafiği)",
    shortDesc:
      "Grafikler arası dönüşüm, merkez açı ve yüzde hesaplamalarıyla LGS veri yorumlama soruları.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Daire grafiğinde tüm verilerin toplamı 360°'ye ve %100'e karşılık gelir.",
      "Merkez açı hesaplama: (İlgili Veri / Toplam Veri) × 360°.",
      "Zaman içindeki değişimi göstermek için çizgi grafiği, karşılaştırma için sütun, bütün içindeki pay için daire grafiği kullanılır.",
    ],
    commonMistakes: [
      "İki farklı daire grafiğindeki oranları toplam miktarları eşitlemeden doğrudan kıyaslamak.",
      "Derece ile yüzdeyi birbirine karıştırmak (%10 = 36°'dir).",
    ],
    strategyTip:
      "İki daire grafiği verilen sorularda toplam sayılar verilmemişse 360 veya EBOB katı olan kolay bir toplam (örneğin 360 ya da 720) seçerek ilerle.",
    questions: [
      {
        question: "Toplam 180 öğrencinin bulunduğu bir okulda öğrencilerin 45'i 8. sınıftır. Daire grafiğinde 8. sınıfların merkez açısı kaç derecedir?",
        options: ["45°", "60°", "90°", "120°"],
        correctIndex: 2,
        explanation: "(45 / 180) × 360° = (1/4) × 360° = 90°.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "basit-olaylarin-olasiligi",
    title: "Basit Olayların Olma Olasılığı",
    shortDesc:
      "Olası durumlar, eş olasılık, kesin olay, imkansız olay ve olasılık değeri hesaplama.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Olasılık = İstenen Olası Durumların Sayısı / Tüm Olası Durumların Sayısı.",
      "Bir olayın olma olasılığı her zaman 0 ile 1 arasındadır (0 ≤ P(A) ≤ 1).",
      "İmkansız olayın olasılığı 0, kesin olayın olasılığı 1'dir.",
      "Bir olayın olma olasılığı ile olmama olasılığının toplamı 1'dir.",
    ],
    commonMistakes: [
      "Olasılık değerini 1'den büyük veya negatif bulduğunda hata yaptığını fark etmemek.",
      "Soruda 'çekilen top geri atılmıyor' ifadesini gözden kaçırmak.",
    ],
    strategyTip:
      "Önce paydadaki tüm durum sayısını netleştir, ardından istenen şartı sağlayan elemanları tek tek listeleyerek say.",
    questions: [
      {
        question: "1'den 10'a kadar (1 ve 10 dahil) numaralandırılmış kartlardan rastgele seçilen bir kartın asal sayı olma olasılığı kaçtır?",
        options: ["3/10", "2/5", "1/2", "3/5"],
        correctIndex: 1,
        explanation: "1'den 10'a kadar asal sayılar: 2, 3, 5, 7 (4 adet). Olasılık = 4/10 = 2/5.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "cebirsel-ifadeler-ve-ozdeslikler",
    title: "Cebirsel İfadeler ve Özdeşlikler",
    shortDesc:
      "İki kare farkı, tam kare özdeşlikler, ortak çarpan parantezine alma ve alan modelleme soruları.",
    avgQuestions: "2 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "İki terimin toplamının karesi: (a + b)² = a² + 2ab + b².",
      "İki terimin farkının karesi: (a - b)² = a² - 2ab + b².",
      "İki kare farkı özdeşliği: a² - b² = (a - b)(a + b).",
    ],
    commonMistakes: [
      "(a + b)² ifadesini a² + b² şeklinde açmak (ortadaki 2ab terimini unutmak).",
      "Kare veya dikdörtgenden parça kesildiğinde kalan alanı hesaplarken iki kare farkını görmemek.",
    ],
    strategyTip:
      "Geometrik şekilli cebirsel sorularda her kenarı x ve sabit sayılar cinsinden şeklin üzerine yaz, ardından istenen alanı çarpanlara ayır.",
    questions: [
      {
        question: "x - y = 6 ve x + y = 10 olduğuna göre x² - y² ifadesinin değeri kaçtır?",
        options: ["16", "36", "60", "100"],
        correctIndex: 2,
        explanation: "İki kare farkı özdeşliğinden x² - y² = (x - y)(x + y) = 6 × 10 = 60 bulunur.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "dogrusal-denklemler",
    title: "Doğrusal Denklemler, Koordinat Sistemi ve Eğim",
    shortDesc:
      "Koordinat düzlemi, doğrusal ilişki grafikleri, eğim (m = dikey/yatay) ve denklem kurma problemleri.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Orta",
    studyMinutes: 50,
    keyPoints: [
      "Eğim (m) = Dikey Uzunluk / Yatay Uzunluk.",
      "y = mx + n doğrusunun eğimi x'in katsayısı olan m'dir.",
      "Sağa yatık doğruların eğimi pozitif, sola yatık doğruların eğimi negatiftir.",
    ],
    commonMistakes: [
      "Eğim bulurken y yalnız değilken doğrudan x'in önündeki sayıyı eğim almak.",
      "Rampa veya merdiven sorularında yatay ve dikey uzunluğu ters oranlamak.",
    ],
    strategyTip:
      "Denklemi ax + by + c = 0 biçiminde verilen sorularda hemen y'yi yalnız bırak: y = (-a/b)x - c/b; böylece eğim = -a/b doğrudan çıkar.",
    questions: [
      {
        question: "2y - 6x + 8 = 0 doğrusunun eğimi kaçtır?",
        options: ["-6", "-3", "3", "6"],
        correctIndex: 2,
        explanation: "2y = 6x - 8 → y = 3x - 4 olur. x'in katsayısı 3 olduğu için eğim 3'tür.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "esitsizlikler",
    title: "Birinci Dereceden Bir Bilinmeyenli Eşitsizlikler",
    shortDesc:
      "Eşitsizlik kurma, sayı doğrusunda gösterim ve eşitsizlik çözme kuralları.",
    avgQuestions: "1 Soru",
    difficulty: "Temel",
    studyMinutes: 30,
    keyPoints: [
      "'En az' ifadesi ≥, 'en fazla' ifadesi ≤, 'fazladır/büyüktür' >, 'azdır/küçüktür' < sembolüyle gösterilir.",
      "Bir eşitsizliğin her iki tarafı negatif bir sayıyla çarpılır veya bölünürse eşitsizlik yön değiştirir.",
      "≤ ve ≥ işaretlerinde sayı doğrusundaki sınır noktası dolu, < ve > işaretlerinde boştur.",
    ],
    commonMistakes: [
      "Negatif sayıya bölerken eşitsizliğin yönünü değiştirmeyi unutmak.",
    ],
    strategyTip:
      "Çözüm sonrası bulduğun aralıktan bir test sayısı seçip ilk eşitsizlikte yerine koyarak yön hatası yapmadığını 5 saniyede doğrula.",
    questions: [
      {
        question: "-2x + 4 ≤ 10 eşitsizliğini sağlayan en küçük x tam sayısı kaçtır?",
        options: ["-4", "-3", "3", "7"],
        correctIndex: 1,
        explanation: "-2x ≤ 6 → her iki taraf -2'ye bölünürse yön değişir: x ≥ -3. En küçük tam sayı -3'tür.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "ucgenler",
    title: "Üçgenler (Üçgen Eşitsizliği, Pisagor ve Eşlik-Benzerlik)",
    shortDesc:
      "Üçgende kenar-açı ilişkisi, üçgen eşitsizliği, Pisagor bağıntısı (a² + b² = c²) ve benzerlik oranı.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "İleri",
    studyMinutes: 55,
    keyPoints: [
      "Üçgen eşitsizliği: Bir kenar uzunluğu diğer iki kenarın farkının mutlak değerinden büyük, toplamından küçüktür: |b - c| < a < b + c.",
      "Dik üçgende hipotenüsün karesi, dik kenarların kareleri toplamına eşittir: a² + b² = c².",
      "Özel dik üçgenler: 3-4-5, 5-12-13, 8-15-17, 7-24-25 ve bunların katları.",
    ],
    commonMistakes: [
      "Üçgen eşitsizliğinde alt sınırı (farkın mutlak değerini) kontrol etmemek.",
      "Benzer üçgenlerde çevre oranının k ile, alan oranının ise k² ile orantılı olduğunu karıştırmak.",
    ],
    strategyTip:
      "Dik üçgen gördüğünde kare almadan önce kenarların 3-4-5 veya 5-12-13'ün katı olup olmadığını kontrol et; çok zaman kazandırır.",
    questions: [
      {
        question: "Kenar uzunlukları 6 cm ve 10 cm olan bir üçgenin üçüncü kenarı tam sayı olarak en fazla kaç cm olabilir?",
        options: ["14", "15", "16", "17"],
        correctIndex: 1,
        explanation: "10 - 6 < x < 10 + 6 → 4 < x < 16. En büyük tam sayı değeri 15'tir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "matematik",
    subjectName: "LGS Matematik",
    topicSlug: "geometrik-cisimler",
    title: "Geometrik Cisimler (Prizmalar, Silindir, Piramit ve Koni)",
    shortDesc:
      "Dik dairesel silindirin yüzey alanı ve hacmi, prizma açınımları, piramit ve koni temel elemanları.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "İleri",
    studyMinutes: 45,
    keyPoints: [
      "Dik dairesel silindirin yanal alanı = 2·π·r·h, tüm yüzey alanı = 2·π·r² + 2·π·r·h.",
      "Silindir hacmi = Taban Alanı × Yükseklik = π·r²·h.",
      "Dikdörtgen şeklindeki bir kağıdın uzun veya kısa kenarı etrafında kıvrılmasıyla iki farklı silindir elde edilebilir.",
    ],
    commonMistakes: [
      "Silindirin açık halinde yan yüzün yatay kenarının taban çevresine (2πr) eşit olduğunu unutmak.",
    ],
    strategyTip:
      "Soruda π = 3 alınız denmişse mutlaka en sade halinde 3 yazarak ilerle; silindirin açık şeklini çizerken taban çevresini dikdörtgenin kenarına eşitle.",
    questions: [
      {
        question: "Yarıçapı 2 cm, yüksekliği 5 cm olan dik dairesel silindirin hacmi kaç cm³'tür? (π = 3 alınız.)",
        options: ["30", "45", "60", "90"],
        correctIndex: 2,
        explanation: "V = π·r²·h = 3 × 2² × 5 = 3 × 4 × 5 = 60 cm³.",
      },
    ],
  },

  // ─── LGS TÜRKÇE ───────────────────────────────────────────────────────────
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "turkce",
    subjectName: "LGS Türkçe",
    topicSlug: "sozcukte-anlam",
    title: "Sözcükte Anlam ve Söz Sanatları",
    shortDesc:
      "Gerçek, mecaz ve terim anlam; eş-zıt anlamlı sözcükler, deyimler, atasözleri ve söz sanatları.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Bir sözcüğün anlamı tek başına değil, mutlaka cümle içinde kazandığı bağlama göre değerlendirilir.",
      "Mecaz anlam sözcüğün gerçek anlamından tamamen uzaklaşmasıyla oluşur.",
      "Kişileştirme (teşhis), konuşturma (intak), benzetme (teşbih) ve abartma (mübalağa) en sık sorulan söz sanatlarıdır.",
    ],
    commonMistakes: [
      "Her konuşturma sanatının aynı zamanda kişileştirme içerdiğini unutmak.",
      "Sözcüğün sadece ilk aklına gelen anlamıyla şıkkı işaretlemek.",
    ],
    strategyTip:
      "Altı çizili söz öbeği sorularında cümlenin tamamını oku ve yerine şıklardaki anlamı koyarak cümlenin akışını test et.",
    questions: [
      {
        question: "'Ağır' sözcüğü aşağıdakilerin hangisinde mecaz anlamda kullanılmıştır?",
        options: [
          "Bu ağır çantayı tek başına taşıma.",
          "Hastanın durumu düne göre biraz ağır.",
          "Masadaki ağır taşları bahçeye çıkardık.",
          "Yük gemisi ağır tonajlı mallar taşıyordu.",
        ],
        correctIndex: 1,
        explanation: "'Durumun ağır olması' tehlikeli/ciddi anlamında mecaz kullanım örneğidir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "turkce",
    subjectName: "LGS Türkçe",
    topicSlug: "cumlede-anlam",
    title: "Cümlede Anlam İlişkileri",
    shortDesc:
      "Neden-sonuç, amaç-sonuç, koşul-sonuç, öznel-nesnel yargılar ve cümle birleştirme soruları.",
    avgQuestions: "3 Soru",
    difficulty: "Temel",
    studyMinutes: 40,
    keyPoints: [
      "Neden-sonuç cümlelerinde eylem gerçekleşmiştir ('-dığı için'). Amaç-sonuçta hedef henüz kesinleşmemiştir ('-mek amacıyla').",
      "Koşul-sonuç cümleleri bir durumun gerçekleşmesini başka bir şarta bağlar ('-se/-sa', 'ancak', 'yeter ki').",
      "Cümle birleştirme sorularında anlam ekleme veya çıkarma yapılmamasına dikkat edilir.",
    ],
    commonMistakes: [
      "Amaç-sonuç ile neden-sonuç cümlelerini birbirine karıştırmak.",
    ],
    strategyTip:
      "Neden mi amaç mı ayırt etmek için yükleme 'Hangi amaçla?' sorusunu sor; eylemin gerçekleşip gerçekleşmediğini kontrol et.",
    questions: [
      {
        question: "Aşağıdaki cümlelerin hangisinde amaç-sonuç ilişkisi vardır?",
        options: [
          "Yağmur yağdığı için maç iptal oldu.",
          "Erken kalkmak amacıyla alarm kurdu.",
          "Çok çalıştığından sınavı kolayca geçti.",
          "Düzenli okursan kelime dağarcığın gelişir.",
        ],
        correctIndex: 1,
        explanation: "'Erken kalkmak amacıyla' ifadesi bir hedefi belirttiği için amaç-sonuç cümlesidir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "turkce",
    subjectName: "LGS Türkçe",
    topicSlug: "paragrafta-anlam",
    title: "Paragrafta Anlam, Ana Düşünce ve Metin Türleri",
    shortDesc:
      "Ana fikir, yardımcı düşünceler, anlatım biçimleri, düşünceyi geliştirme yolları ve görsel okuma.",
    avgQuestions: "7 - 9 Soru",
    difficulty: "Orta",
    studyMinutes: 60,
    keyPoints: [
      "Ana düşünce: Yazarın okuyucuya vermek istediği temel mesajdır ('Bu parçada asıl anlatılmak istenen...').",
      "Anlatım biçimleri: Açıklayıcı, Tartışmacı, Öyküleyici, Betimleyici.",
      "Olumsuz soru köklerinde ('değinilmemiştir', 'çıkarılamaz') şıkları metinle tek tek eşleştirerek eleyin.",
    ],
    commonMistakes: [
      "Parçada geçmeyen ancak günlük hayatta doğru bildiğin bir yargıyı metinden çıkarılmış gibi işaretlemek.",
    ],
    strategyTip:
      "Önce soru kökünü oku, ardından metni tek seferde odaklanarak oku. Uzun paragraflarda her cümlenin anahtar kelimesinin altını çiz.",
    questions: [
      {
        question: "Bir yazarın kendi düşüncesini savunup karşı görüşü çürütmeye çalıştığı metinlerde hangi anlatım biçimi ağırlıklıdır?",
        options: ["Betimleme", "Öyküleme", "Tartışma", "Açıklama"],
        correctIndex: 2,
        explanation: "Kendi fikrini benimsetme ve karşı düşünceyi eleştirme amacı taşıyan metinlerde tartışmacı anlatım kullanılır.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "turkce",
    subjectName: "LGS Türkçe",
    topicSlug: "fiilimsiler",
    title: "Fiilimsiler (İsim-Fiil, Sıfat-Fiil, Zarf-Fiil)",
    shortDesc:
      "Eylemsilerin ekleri, kalıcı isimlerden farkı ve cümledeki görevleri.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Orta",
    studyMinutes: 40,
    keyPoints: [
      "İsim-Fiil ekleri: -ma / -ış / -mak ('mayışmak').",
      "Sıfat-Fiil ekleri: -an / -ası / -mez / -ar / -dik / -ecek / -miş ('anası mezar dikecekmiş').",
      "Zarf-Fiil ekleri: -ken, -alı, -asiye, -ince, -ip, -arak, -dıkça, -meden, -meksizin, -r...-mez.",
      "Fiilimsiler fiil kök veya gövdesine gelir ama kip ve şahıs eki almaz; olumsuzluk eki (-me/-ma) alabilir.",
    ],
    commonMistakes: [
      "'Dondurma', 'dolma', 'çakmak' gibi kalıcı isimleri fiilimsi sanmak (kalıcı isimler -ma/-me ile olumsuz yapılamaz).",
      "Çekimli fiildeki '-ecek/-miş/-mez' zaman eklerini sıfat-fiil ile karıştırmak.",
    ],
    strategyTip:
      "Şüphelendiğin sözcüğe '-ma/-me' olumsuzluk eki getir; anlamlı oluyorsa ve yüklemde kip eki görevinde değilse fiilimsidir.",
    questions: [
      {
        question: "'Koşarak yanımıza gelen çocuk gülümsedi.' cümlesinde sırasıyla hangi fiilimsiler vardır?",
        options: [
          "İsim-fiil ve Sıfat-fiil",
          "Zarf-fiil ve Sıfat-fiil",
          "Sıfat-fiil ve Zarf-fiil",
          "Yalnızca Zarf-fiil",
        ],
        correctIndex: 1,
        explanation: "'Koşarak' (-arak) zarf-fiil, 'gelen' (-en) ise sıfat-fiildir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "turkce",
    subjectName: "LGS Türkçe",
    topicSlug: "cumlenin-ogeleri",
    title: "Cümlenin Ögeleri",
    shortDesc:
      "Temel ögeler (Yüklem, Özne) ve yardımcı ögeler (Nesne, Yer Tamlayıcısı, Zarf Tamlayıcısı) bulma sırası.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Orta",
    studyMinutes: 40,
    keyPoints: [
      "Öge bulma sırası: Önce Yüklem, sonra Özne (Ne/Kim), sonra diğer ögeler (Neyi/Kimi, Kime/Nerede/Nereden, Nasıl/Ne zaman).",
      "Tamlamalar, deyimler ve birleşik fiiller ögelere ayrılırken kesinlikle bölünmez.",
    ],
    commonMistakes: [
      "Özne ile Belirtisiz Nesneyi karıştırmak (her ikisi de 'Ne?' sorusuna yanıt verir; bu yüzden önce Özne bulunmalıdır).",
    ],
    strategyTip:
      "Yüklemi bulduktan sonra 'Yapan kim / Olan ne?' kalıbıyla Özne'yi netleştir; böylece belirtisiz nesneyi özne sanmazsın.",
    questions: [
      {
        question: "'Sabahları parkta düzenli olarak koşarım.' cümlesindeki 'parkta' sözcüğü hangi ögedir?",
        options: ["Özne", "Belirtisiz Nesne", "Yer Tamlayıcısı", "Zarf Tamlayıcısı"],
        correctIndex: 2,
        explanation: "'Nerede koşarım?' sorusunun cevabı olan 'parkta' sözcüğü Yer Tamlayıcısıdır (Dolaylı Tümleç).",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "turkce",
    subjectName: "LGS Türkçe",
    topicSlug: "yazim-kurallari",
    title: "Yazım Kuralları (Büyük Harfler, de/ki/mi)",
    shortDesc:
      "Bağlaç olan de/da ve ki'nin yazımı, soru eki mi, birleşik sözcükler ve sayıların yazımı.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Orta",
    studyMinutes: 35,
    keyPoints: [
      "Bağlaç olan 'de/da' her zaman ayrı yazılır ve hiçbir zaman 'te/ta' olmaz; cümleden çıkarıldığında anlam bozulmaz.",
      "Bağlaç olan 'ki' ayrı yazılır ('som bahçemi' istisnaları hariç: sanki, oysaki, mademki, belki, halbuki, çünkü, meğerki, illaki).",
      "Tarihler belirli bir gün bildiriyorsa ay ve gün adları büyük yazılır (14 Haziran 2026 Pazar).",
    ],
    commonMistakes: [
      "Özel isimlere gelen yapım eklerini kesme işaretiyle ayırmak ('Türkçe'nin' yanlıştır, doğrusu 'Türkçenin').",
    ],
    strategyTip:
      "Cümlede 'ki' ekinden sonra '-ler' getir; anlamlıysa bitişik (ilgi/sıfat -ki), anlamsızsa ayrı (bağlaç ki) yazılır.",
    questions: [
      {
        question: "Aşağıdaki cümlelerin hangisinde yazım yanlışı vardır?",
        options: [
          "Sen de bizimle gelecek misin?",
          "Evdeki hesap çarşıya uymadı.",
          "Yarınki sınav için çok heyecanlıydı.",
          "Okulda ki tören saat onda başladı.",
        ],
        correctIndex: 3,
        explanation: "'Okuldaki' sözcüğündeki -ki sıfat yapan ek olduğu için bitişik yazılmalıdır.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "turkce",
    subjectName: "LGS Türkçe",
    topicSlug: "noktalama-isaretleri",
    title: "Noktalama İşaretleri",
    shortDesc:
      "Virgül, noktalı virgül, iki nokta, kesme işareti ve tırnak işaretinin doğru kullanım alanları.",
    avgQuestions: "1 Soru",
    difficulty: "Temel",
    studyMinutes: 30,
    keyPoints: [
      "İki nokta (:) sonrasında açıklama veya özel isim gelirse büyük, örnekler sıralanırsa küçük harfle başlanır.",
      "Noktalı virgül (;) yalnızca cümle içinde zaten virgül kullanılmışsa tür/takım ayırmak için devreye girer.",
      "Zarf-fiil eklerinden (-ıp, -arak, -ınca) sonra tek başına virgül konmaz.",
    ],
    commonMistakes: [
      "Virgül bulunmayan basit bir cümlede doğrudan noktalı virgül kullanmak.",
    ],
    strategyTip:
      "İki nokta ile noktalı virgülü ayırt etmek için: Açıklama/örnek veriyorsa iki nokta (:), grupları ayırıyorsa noktalı virgül (;) seç.",
    questions: [
      {
        question: "Aşağıdakilerin hangisinde noktalı virgül (;) doğru kullanılmıştır?",
        options: [
          "Pazardan; elma, armut ve muz aldık.",
          "Erkek çocuklara Can, Mert; kız çocuklara Ela, Defne adı verildi.",
          "Eve geldi; ancak kimseyi bulamadı; sonra çıktı.",
          "Bugün hava çok güzel; dışarı çıkalım mı?",
        ],
        correctIndex: 1,
        explanation: "İçinde virgül bulunan iki farklı grubu (erkek/kız çocuk isimleri) ayırmak için noktalı virgül doğru kullanılmıştır.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "turkce",
    subjectName: "LGS Türkçe",
    topicSlug: "sozel-mantik-ve-muhakeme",
    title: "Sözel Mantık ve Muhakeme",
    shortDesc:
      "Sıralama, eşleştirme ve tablo kurma yöntemiyle LGS sözel mantık sorularını hatasız çözme.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "İleri",
    studyMinutes: 45,
    keyPoints: [
      "Değişken sayısı 2 ise basit çizelge, 3 veya daha fazlaysa mutlaka satır-sütun tablosu çizilmelidir.",
      "Kesin bilgiler tabloya önce yerleştirilir; ihtimaller parantez içinde veya oklarla gösterilir.",
    ],
    commonMistakes: [
      "Soruyu kafadan çözmeye çalışmak ve 'kesinlikle doğrudur' ile 'olabilir' ifadelerini karıştırmak.",
    ],
    strategyTip:
      "Soru kökündeki 'kesinlikle' vurgusuna dikkat et; iki ihtimalli durumlarda iki küçük alternatif tablo çizmek tüm şıkları netleştirir.",
    questions: [
      {
        question: "Ali, Burcu, Can ve Deniz 1'den 4'e kadar sıralanmıştır. Burcu 1. değildir. Can, Ali'nin hemen önündedir. Deniz 4. sıradadır. Buna göre 1. sırada kim vardır?",
        options: ["Ali", "Burcu", "Can", "Deniz"],
        correctIndex: 2,
        explanation: "Deniz 4. sıradadır. Can, Ali'nin hemen önünde olacaksa (Can-Ali ikilisi 1-2 veya 2-3 olabilir). Burcu 1. olamayacağına göre Can 1., Ali 2., Burcu 3. sıradadır.",
      },
    ],
  },

  // ─── LGS FEN BİLİMLERİ ────────────────────────────────────────────────────
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "fen-bilimleri",
    subjectName: "LGS Fen Bilimleri",
    topicSlug: "mevsimler-ve-iklim",
    title: "Mevsimler ve İklim",
    shortDesc:
      "Dünya'nın eksen eğikliği (23° 27'), 21 Haziran-21 Aralık-21 Mart-23 Eylül tarihleri, alçak/yüksek basınç ve iklim.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Temel",
    studyMinutes: 40,
    keyPoints: [
      "Mevsimlerin oluşmasının iki temel nedeni: Dünya'nın Güneş etrafında dolanması ve eksen eğikliği (23° 27').",
      "21 Haziran'da Kuzey Yarım Küre'de en uzun gündüz yaşanır; güneş ışınları Yengeç Dönencesi'ne dik gelir.",
      "Rüzgar her zaman Yüksek Basınç (soğuk, alçalıcı hava) alanından Alçak Basınç (sıcak, yükselici hava) alanına eser.",
    ],
    commonMistakes: [
      "Mevsimlerin oluşumunu Dünya'nın Güneş'e olan uzaklığının değişmesine bağlamak (uzaklık mevsimleri etkilemez).",
      "Yüksek basınç alanının sıcak olduğunu sanmak (yüksek basınç soğuk ve açıktır, alçak basınç sıcak ve bulutludur).",
    ],
    strategyTip:
      "Rüzgar sorularında 'Soğuktan Sıcağa (Yüksek -> Alçak)' kuralını şeklin üzerine okla çiz; her soruyu hatasız çözersin.",
    questions: [
      {
        question: "21 Aralık tarihinde Güney Yarım Küre'de hangi mevsim başlar?",
        options: ["Kış", "İlkbahar", "Yaz", "Sonbahar"],
        correctIndex: 2,
        explanation: "21 Aralık'ta Kuzey Yarım Küre'de kış, Güney Yarım Küre'de ise yaz mevsimi başlar.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "fen-bilimleri",
    subjectName: "LGS Fen Bilimleri",
    topicSlug: "dna-ve-genetik-kod",
    title: "DNA, Genetik Kod, Kalıtım ve Biyoteknoloji",
    shortDesc:
      "Nükleotit yapısı, DNA eşlenmesi, Mendel çaprazlamaları, mutasyon-modifikasyon ve adaptasyon.",
    avgQuestions: "4 - 5 Soru",
    difficulty: "Orta",
    studyMinutes: 55,
    keyPoints: [
      "Büyükten küçüğe sıralama (KeDiGeN): Kromozom > DNA > Gen > Nükleotit.",
      "DNA'da Adenin (A) karşısına Timin (T), Guanin (G) karşısına Sitozin (C) gelir: A = T ve G = C.",
      "Mutasyon gen yapısını değiştirir (kalıtsal olabilir); modifikasyon gen işleyişini değiştirir (kalıtsal değildir).",
    ],
    commonMistakes: [
      "Çuha çiçeği veya himalaya tavşanı gibi modifikasyon örneklerini adaptasyon sanmak.",
      "İnsanda cinsiyeti belirleyen kromozomun anneden geldiğini düşünmek (babadan gelen X veya Y belirler).",
    ],
    strategyTip:
      "Çaprazlama sorularında Melez (Aa) × Melez (Aa) çaprazlamasının sonucunu (1 AA : 2 Aa : 1 aa — %75 baskın, %25 çekinik) hazır bilmek çok hız kazandırır.",
    questions: [
      {
        question: "Bir DNA molekülünde toplam 400 nükleotit ve 80 Adenin nükleotidi varsa Guanin nükleotit sayısı kaçtır?",
        options: ["80", "120", "160", "240"],
        correctIndex: 1,
        explanation: "A = T = 80 → A + T = 160. Kalan 400 - 160 = 240 nükleotit G + C'dir. G = C = 120 olur.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "fen-bilimleri",
    subjectName: "LGS Fen Bilimleri",
    topicSlug: "basinc",
    title: "Katı, Sıvı ve Gaz Basıncı",
    shortDesc:
      "Katılarda ağırlık/yüzey alanı ilişkisi, sıvılarda derinlik ve yoğunluk (Pascal Prensibi), açık hava basıncı (Toriçelli).",
    avgQuestions: "3 Soru",
    difficulty: "Orta",
    studyMinutes: 50,
    keyPoints: [
      "Katı basıncı: P = Ağırlık (G) / Yüzey Alanı (S). Yüzey küçüldükçe basınç artar.",
      "Sıvı basıncı: P = Derinlik (h) × Yoğunluk (d). Kabın şekline ve sıvı miktarına bağlı değildir.",
      "Pascal Prensibi: Kapalı kaplardaki sıvılar üzerlerine uygulanan basıncı her yöne aynı büyüklükte iletir.",
    ],
    commonMistakes: [
      "Sıvı basıncını kabın taban alanına veya kaptaki sıvı hacmine bağlı sanmak.",
      "Deniz seviyesinden yukarılara çıkıldıkça açık hava basıncının arttığını düşünmek (yukarı çıkıldıkça azalır).",
    ],
    strategyTip:
      "Katı basıncında düzgün yükselen (dikdörtgen, silindir) cisimler dikey olarak kesilirse ağırlık ve yüzey alanı aynı oranda azaldığından basınç değişmez!",
    questions: [
      {
        question: "Özdeş iki tuğladan biri yatay, diğeri dikey olarak kum zemine konulduğunda hangisi kuma daha çok batar?",
        options: ["Yatay konulan", "Dikey konulan", "İkisi eşit batar", "Tuğla rengine bağlıdır"],
        correctIndex: 1,
        explanation: "Ağırlıklar eşitken dikey konulan tuğlanın temas yüzey alanı daha küçük olduğu için basıncı büyüktür ve kuma daha çok batar.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "fen-bilimleri",
    subjectName: "LGS Fen Bilimleri",
    topicSlug: "madde-ve-endustri",
    title: "Madde ve Endüstri (Periyodik Sistem, Asit-Baz ve Isı)",
    shortDesc:
      "Periyodik tablo grupları, fiziksel-kimyasal değişimler, asit ve bazların pH değerleri, öz ısı.",
    avgQuestions: "4 - 5 Soru",
    difficulty: "İleri",
    studyMinutes: 60,
    keyPoints: [
      "Periyodik tabloda yatay sıralara periyot (7 adet), dikey sütunlara grup (18 adet) denir.",
      "pH < 7 asit (turnusolu kırmızıya çevirir), pH = 7 nötr, pH > 7 baz (turnusolu maviye çevirir).",
      "Öz ısı (c) küçük olan maddeler daha çabuk ısınır ve daha çabuk soğur.",
    ],
    commonMistakes: [
      "Hidrojen (1A grubunda) elementini metal sanmak (Hidrojen ametaldir).",
      "Kimyasal tepkimelerde toplam kütlenin veya atom sayısının değişebileceğini düşünmek (her zaman korunur).",
    ],
    strategyTip:
      "Isınma grafiklerinde yatay çizgi gördüğün yer hal değişim sıcaklığıdır; sıcaklık sabitken madde ısı almaya devam eder.",
    questions: [
      {
        question: "pH değeri 3 olan bir çözelti ile ilgili aşağıdakilerden hangisi doğrudur?",
        options: [
          "Bazik özellik gösterir.",
          "Kırmızı turnusol kağıdını maviye çevirir.",
          "Asidik özellik gösterir.",
          "Nötr bir maddedir.",
        ],
        correctIndex: 2,
        explanation: "pH < 7 olduğu için madde asidiktir ve mavi turnusol kağıdını kırmızıya çevirir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "fen-bilimleri",
    subjectName: "LGS Fen Bilimleri",
    topicSlug: "basit-makineler",
    title: "Basit Makineler (Makaralar, Kaldıraçlar, Eğik Düzlem)",
    shortDesc:
      "Kuvvetten kazanç, yoldan kayıp, sabit/hareketli makara ve kaldıraç dengesi (Kuvvet × Kuvvet Kolu = Yük × Yük Kolu).",
    avgQuestions: "2 - 3 Soru",
    difficulty: "İleri",
    studyMinutes: 45,
    keyPoints: [
      "Hiçbir basit makine işten veya enerjiden kazanç sağlamaz; yalnızca iş kolaylığı sağlar.",
      "Kuvvetten kazanç varsa aynı oranda yoldan kayıp vardır.",
      "Sabit makara kuvvetten kazanç sağlamaz, yalnızca kuvvetin yönünü değiştirir. Hareketli makarada 2 kat kuvvet kazancı vardır.",
    ],
    commonMistakes: [
      "Kuvvet kazancı olan bir sistemde işten de kazanç sağlandığını düşünmek.",
    ],
    strategyTip:
      "Palanga ve makara sorularında yükü taşıyan ip sayısını say; kuvvet = Yük / Taşıyan İp Sayısı (sürtünmesiz ortamda).",
    questions: [
      {
        question: "60 N ağırlığındaki bir yük, ağırlıksız tek bir hareketli makara ile dengelenmek istenirse en az kaç N kuvvet uygulanmalıdır?",
        options: ["15 N", "30 N", "60 N", "120 N"],
        correctIndex: 1,
        explanation: "Tek hareketli makarada yükü 2 ip taşıdığı için F = 60 / 2 = 30 N olur.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "fen-bilimleri",
    subjectName: "LGS Fen Bilimleri",
    topicSlug: "elektrik-yukleri-ve-enerjisi",
    title: "Elektrik Yükleri ve Elektrik Enerjisi",
    shortDesc:
      "Elektriklenme çeşitleri, elektroskop, topraklama ve elektrik enerjisinin ısı-ışık-hareket enerjisine dönüşümü.",
    avgQuestions: "2 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Aynı cins yükler birbirini iter, zıt cins yükler ve yüklü-nötr cisimler birbirini çeker.",
      "Sürtünme ile elektriklenmede zıt yükler oluşur; dokunma ile elektriklenmede toplam yük paylaşılır (aynı cins yük).",
      "Topraklama yüklü bir cismi nötr hale getirir.",
    ],
    commonMistakes: [
      "İki cismin birbirini çekmesini kesinlikle zıt yüklü olduklarına kanıt saymak (biri nötr de olabilir).",
    ],
    strategyTip:
      "Birbirini iten iki cisim gördüğünde ikisinin de kesinlikle aynı cins yüklü olduğunu hemen not al; bu kesin bilgidir.",
    questions: [
      {
        question: "Nötr bir cisme pozitif (+) yüklü bir çubuk yaklaştırıldığında ne olur?",
        options: [
          "Cisim çubuğu iter.",
          "Cisim çubuğa doğru çekilir.",
          "Hiçbir etkileşim olmaz.",
          "Nötr cisim tamamen (+) yükle dolar.",
        ],
        correctIndex: 1,
        explanation: "Etki ile elektriklenmeden dolayı nötr cismin yakın ucu (-) yüklenir ve çubuk tarafından çekilir.",
      },
    ],
  },

  // ─── YKS: TYT MATEMATİK ───────────────────────────────────────────────────
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-matematik",
    subjectName: "TYT Matematik",
    topicSlug: "temel-kavramlar",
    title: "Temel Kavramlar, Tek-Çift Sayılar ve Asal Sayılar",
    shortDesc:
      "Rakam-sayı farkı, tek-çift analizi, ardışık sayılar toplamı ve TYT matematik ilk soru teknikleri.",
    avgQuestions: "3 - 4 Soru",
    difficulty: "Temel",
    studyMinutes: 45,
    keyPoints: [
      "0 bir çift tam sayıdır ve pozitif/negatif değildir.",
      "Tek sayıların tüm pozitif tam sayı kuvvetleri tek, çift sayıların pozitif tam sayı kuvvetleri çifttir (0 hariç).",
      "Ardışık tam sayılar toplamı = [(Son Terim + İlk Terim) / 2] × Terim Sayısı.",
    ],
    commonMistakes: [
      "Soruda 'gerçel sayı' denmesine rağmen sadece tam sayı değerleri denemek.",
      "Negatif sayıların tek/çiftliğini göz ardı etmek (-3 tektir, -4 çifttir).",
    ],
    strategyTip:
      "Toplamları sabit iki sayının çarpımının en büyük olması için sayılar birbirine en yakın, en küçük olması için en uzak seçilir.",
    questions: [
      {
        question: "x ve y birer pozitif tam sayı ve x + y = 15 ise x · y çarpımı en fazla kaç olabilir?",
        options: ["44", "50", "54", "56"],
        correctIndex: 3,
        explanation: "Çarpımın en büyük olması için sayılar en yakın seçilir: 7 + 8 = 15 → 7 × 8 = 56.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-matematik",
    subjectName: "TYT Matematik",
    topicSlug: "bolme-bolunebilme",
    title: "Sayı Basamakları ve Bölme-Bölünebilme",
    shortDesc:
      "Çözümleme, kalanlı bölme özellikleri ve 2, 3, 4, 5, 8, 9, 10, 11 ile bölünebilme kuralları.",
    avgQuestions: "2 Soru",
    difficulty: "Orta",
    studyMinutes: 40,
    keyPoints: [
      "Kalan her zaman bölen sayıdan küçük olmalıdır (0 ≤ Kalan < Bölen).",
      "3 ve 9 ile bölünebilme rakamları toplamına; 4 ve 8 son iki/üç basamağa; 5 ve 10 son basamağa bakar.",
      "Aralarında asal iki sayıya (ör. 12 için 3 ve 4, 36 için 4 ve 9) tam bölünen sayı bunların çarpımına da tam bölünür.",
    ],
    commonMistakes: [
      "45 ile bölünebilme için 3 ve 15'i seçmek (aralarında asal olmadıkları için 5 ve 9 seçilmelidir).",
    ],
    strategyTip:
      "Birden fazla bölünebilme kuralı bir aradaysa önce son basamağı ilgilendiren kuralı (2, 5, 10, 4) uygula, ardından rakam toplamına (3, 9) geç.",
    questions: [
      {
        question: "Dört basamaklı 4a2b sayısı 45 ile tam bölünebildiğine göre a'nın alabileceği değerler toplamı kaçtır?",
        options: ["7", "10", "12", "15"],
        correctIndex: 1,
        explanation:
          "45 = 5 × 9 (aralarında asal). 5 ile bölünmesi için b = 0 veya b = 5 olur. b = 0 için 4 + a + 2 + 0 = 6 + a → a = 3 bulunur. b = 5 için 4 + a + 2 + 5 = 11 + a → a = 7 bulunur. Toplam 3 + 7 = 10'dur.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-matematik",
    subjectName: "TYT Matematik",
    topicSlug: "uslu-ve-koklu-sayilar",
    title: "TYT Üslü ve Köklü Sayılar",
    shortDesc:
      "Üslü denklemler, eşlenik ile paydayı rasyonel yapma ve iç içe kök kuralları.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Paydadaki √a + √b ifadesinin eşleniği √a - √b'dir ve çarpımları a - b olur.",
      "√(a + 2√b) biçimindeki ifadelerde çarpımları b, toplamları a olan m ve n sayıları için sonuç √m + √n olur.",
    ],
    commonMistakes: [
      "Üslü denklemlerde çift kuvvet durumunda negatif kök ihtimalini atlamak.",
    ],
    strategyTip:
      "Paydada köklü ifade gördüğün anda eşlenikle çarparak sadeleştirme yoluna git.",
    questions: [
      {
        question: "2ˣ = 3 ve 2ʸ = 5 olduğuna göre 2ˣ⁺ʸ⁺¹ ifadesinin değeri kaçtır?",
        options: ["15", "16", "30", "45"],
        correctIndex: 2,
        explanation: "2ˣ⁺ʸ⁺¹ = 2ˣ · 2ʸ · 2¹ = 3 × 5 × 2 = 30.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-matematik",
    subjectName: "TYT Matematik",
    topicSlug: "problemler",
    title: "TYT Problemler (Sayı, Kesir, Yaş, Yüzde, Karışım)",
    shortDesc:
      "TYT'nin en belirleyici bölümü: denklem kurma, yüzde-kar-zarar, hareket ve rutin olmayan problemler.",
    avgQuestions: "10 - 12 Soru",
    difficulty: "İleri",
    studyMinutes: 75,
    keyPoints: [
      "Kesir problemlerinde paydaların EKOK'u kadar bilinmeyen (ör. 12x) seçmek kesirli işlem yükünü sıfırlar.",
      "Yüzde problemlerinde başlangıç değerine 100x demek pratiklik sağlar.",
      "Yaş problemlerinde iki kişinin yaş farkı zaman geçse de asla değişmez.",
    ],
    commonMistakes: [
      "Art arda yapılan %20 zam ve %20 indirimin başlangıç fiyatına geri döndüğünü sanmak (100 → 120 → 96 olur).",
    ],
    strategyTip:
      "Her gün düzenli 15-20 dakika zaman tutarak 10-12 problem çözmek TYT hızını doğrudan artırır.",
    questions: [
      {
        question: "%25 kar ile 250 TL'ye satılan bir ürünün maliyet fiyatı kaç TL'dir?",
        options: ["180", "190", "200", "210"],
        correctIndex: 2,
        explanation: "Maliyet 100x ise %25 karlı satış 125x = 250 → x = 2. Maliyet = 200 TL.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-matematik",
    subjectName: "TYT Matematik",
    topicSlug: "fonksiyonlar",
    title: "Fonksiyonlar (TYT & AYT Ortak Temel)",
    shortDesc:
      "Fonksiyon tanımı, bileşke fonksiyon (f∘g), ters fonksiyon ve grafik okuma.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Orta",
    studyMinutes: 50,
    keyPoints: [
      "Tanım kümesindeki her elemanın değer kümesinde yalnız bir görüntüsü olmalıdır.",
      "(f∘g)(x) = f(g(x)) ve (f∘g)⁻¹ = g⁻¹ ∘ f⁻¹.",
      "Grafik sorularında x eksenini kesen noktalar fonksiyonun sıfırlarıdır.",
    ],
    commonMistakes: [
      "f(x + 2) ifadesini f(x) + 2 ile karıştırmak.",
    ],
    strategyTip:
      "f(ax + b) verilip f(k) soruluyorsa önce ax + b = k eşitliğini çözüp bulduğun x değerini sağ tarafta yerine koy.",
    questions: [
      {
        question: "f(x) = 3x - 5 ise f⁻¹(7) değeri kaçtır?",
        options: ["3", "4", "5", "16"],
        correctIndex: 1,
        explanation: "f⁻¹(7) = a ise f(a) = 7 → 3a - 5 = 7 → 3a = 12 → a = 4.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-matematik",
    subjectName: "TYT Matematik",
    topicSlug: "permutasyon-kombinasyon-olasilik",
    title: "Permütasyon, Kombinasyon ve Olasılık",
    shortDesc:
      "Saymanın temel ilkesi, sıralama (P), seçme (C), binom açılımı ve koşullu olasılık.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "İleri",
    studyMinutes: 60,
    keyPoints: [
      "Sıralama önemliyse Permütasyon, yalnızca grup/takım seçimi varsa Kombinasyon kullanılır.",
      "C(n, r) = C(n, n - r) ve C(n, 0) + C(n, 1) + ... + C(n, n) = 2ⁿ.",
    ],
    commonMistakes: [
      "'En az 1' sorularında tüm durumdan istenmeyen (0 olma) durumunu çıkarmak yerine tek tek tüm durumları sayarken eksik bırakmak.",
    ],
    strategyTip:
      "Birlikte olması istenen elemanları bir paket gibi bağlayıp tek eleman say, ardından paket içindeki kendi sıralamalarını çarp.",
    questions: [
      {
        question: "5 kişilik bir gruptan 3 kişilik bir ekip kaç farklı şekilde seçilebilir?",
        options: ["10", "15", "20", "60"],
        correctIndex: 0,
        explanation: "Seçme işleminde sıralama önemli olmadığından C(5, 3) = C(5, 2) = (5 × 4) / 2 = 10.",
      },
    ],
  },

  // ─── YKS: TYT TÜRKÇE ──────────────────────────────────────────────────────
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-turkce",
    subjectName: "TYT Türkçe",
    topicSlug: "paragraf-teknikleri",
    title: "TYT Paragraf Taktikleri ve Hızlı Anlama",
    shortDesc:
      "Ana düşünce, akışı bozan cümle, paragraf ikiye bölme ve çoklu paragraf sorularında hız kazanma.",
    avgQuestions: "22 - 25 Soru",
    difficulty: "Orta",
    studyMinutes: 60,
    keyPoints: [
      "TYT Türkçe'nin yarısından fazlası paragraf ve anlam bilgisinden oluşur.",
      "Akışı bozan cümlede bir önceki ve bir sonraki cümlenin bağlaç/zamir bağlantısı kontrol edilir.",
      "Paragraf tamamlama sorularında boşluktan hemen önceki ve hemen sonraki cümlenin öznesi anahtardır.",
    ],
    commonMistakes: [
      "Soruyu hızlı okuyacağım diye metnin son cümlesindeki 'ama, fakat, ancak' dönüşünü kaçırmak.",
    ],
    strategyTip:
      "Paragraf sorularında her gün tek oturuşta 25 soru çözerek okuma kondisyonunu 40 dakikanın altına indir.",
    questions: [
      {
        question: "Bir paragrafta 'ama, ne var ki, buna rağmen' gibi ifadelerden sonra gelen bölüm genellikle neyi belirtir?",
        options: [
          "Önceki düşüncenin aynısını",
          "Yazarın asıl vurgulamak istediği karşıt veya temel görüşü",
          "Konu dışı bir örneği",
          "Metnin giriş cümlesini",
        ],
        correctIndex: 1,
        explanation: "Zıtlık ve geçiş bağlaçlarından sonra yazar genellikle esas mesajını verir.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-turkce",
    subjectName: "TYT Türkçe",
    topicSlug: "ses-bilgisi",
    title: "Ses Bilgisi (Ses Olayları)",
    shortDesc:
      "Ünlü düşmesi, ünsüz benzeşmesi, ünsüz yumuşaması, ünlü daralması ve ulama.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Orta",
    studyMinutes: 35,
    keyPoints: [
      "Fıstıkçı Şahap (f, s, t, k, ç, ş, h, p) harflerinden sonra c, d, g gelirse ç, t, k'ye dönüşür (Ünsüz Benzeşmesi).",
      "Ünlü daralması genellikle '-yor' ekinden önceki a/e'nin ı/i/u/ü'ye dönmesiyle oluşur ('bekle-yor → bekliyor').",
    ],
    commonMistakes: [
      "'Seviyor' veya 'geliyor' gibi ünsüzle biten fiillerdeki yardımcı ünlüyü (i) ünlü daralması sanmak.",
    ],
    strategyTip:
      "Ünlü daralması ararken '-yor' ekini kapat; kalan kökün sonu 'a' veya 'e' ile bitmiyorsa orada daralma yoktur (istisna: diye, yiyecek, niye).",
    questions: [
      {
        question: "'Kitapçı' sözcüğünde hangi ses olayı vardır?",
        options: ["Ünsüz yumuşaması", "Ünsüz benzeşmesi (sertleşmesi)", "Ünlü düşmesi", "Ünlü daralması"],
        correctIndex: 1,
        explanation: "'Kitap' sözcüğü sert ünsüz (p) ile bittiği için '-cı' eki '-çı' şekline dönüşmüştür (Ünsüz benzeşmesi).",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-turkce",
    subjectName: "TYT Türkçe",
    topicSlug: "tyt-yazim-noktalama",
    title: "TYT Yazım Kuralları ve Noktalama",
    shortDesc:
      "Birleşik kelimelerin yazımı, kısaltmalar, düzeltme işareti ve karma noktalama soruları.",
    avgQuestions: "4 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Yardımcı fiillerle (etmek, olmak) kurulan birleşik fiillerde ses düşmesi veya türemesi varsa bitişik, yoksa ayrı yazılır (hissetmek, fark etmek).",
      "Büyük harfle yapılan kısaltmalara getirilen ekler kısaltmanın okunuşuna göre yazılır (TDK'nin, TBMM'ye).",
    ],
    commonMistakes: [
      "'TDK'nın' yazmak (Türkçede 'ka' sesi yoktur, 'ke' olarak okunduğu için TDK'nin doğrudur).",
    ],
    strategyTip:
      "Sık karıştırılan sözcükleri (ör. yalnız, yanlış, kirpik, kiprik, şoför, stajyer) küçük bir karta not et.",
    questions: [
      {
        question: "Aşağıdaki birleşik sözcüklerden hangisinin yazımı doğrudur?",
        options: ["Terketmek", "Farketmek", "Hissetmek", "Arzetmek"],
        correctIndex: 2,
        explanation: "'His + etmek' birleşirken s ünsüzü türediği için 'hissetmek' bitişik, diğerleri ses olayı olmadığı için ayrı yazılır.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-turkce",
    subjectName: "TYT Türkçe",
    topicSlug: "sozcuk-turleri-ve-tamlamalar",
    title: "Sözcük Türleri, Ekler ve Tamlamalar",
    shortDesc:
      "İsim, sıfat, zamir, zarf, edat-bağlaç-ünlem, fiil çatısı ve isim-sıfat tamlamaları.",
    avgQuestions: "3 - 4 Soru",
    difficulty: "İleri",
    studyMinutes: 50,
    keyPoints: [
      "Sıfat ismin önüne gelir ve onu niteler/belirtir; zamir ise ismin yerini tutar.",
      "Zarf fiili, fiilimsiyi, sıfatı veya başka bir zarfı durum, zaman, yer-yön, miktar bakımından etkiler.",
      "Yer-yön zarfları (ileri, geri, içeri, dışarı) ek almadan kullanılırsa zarf, ek alırsa isim olur.",
    ],
    commonMistakes: [
      "'İçeriye girdi' cümlesindeki 'içeriye' sözcüğünü yer-yön zarfı sanmak (yönelme eki aldığı için yer tamlayıcısı / isimdir).",
    ],
    strategyTip:
      "Bir sözcüğün türünü soran soruda hemen sağındaki kelimeye bak: isimse sıfat, fiil/fiilimsi ise zarf olma ihtimali çok yüksektir.",
    questions: [
      {
        question: "'Güzel konuşan insan her zaman dinlenir.' cümlesinde 'güzel' sözcüğünün türü nedir?",
        options: ["İsim", "Sıfat", "Zarf", "Zamir"],
        correctIndex: 2,
        explanation: "'Güzel' sözcüğü 'konuşan' sıfat-fiilini durum yönünden etkilediği için zarftır.",
      },
    ],
  },

  // ─── YKS: TYT FİZİK ───────────────────────────────────────────────────────
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-fizik",
    subjectName: "TYT Fizik",
    topicSlug: "fizik-bilimine-giris",
    title: "Fizik Bilimine Giriş ve Büyüklükler",
    shortDesc:
      "Fiziğin alt dalları (KAMYONET), temel-türetilmiş büyüklükler (KISAMUZ) ve skaler-vektörel nicelikler.",
    avgQuestions: "1 Soru",
    difficulty: "Temel",
    studyMinutes: 30,
    keyPoints: [
      "Temel büyüklükler (KISAMUZ): Kütle, Işık Şiddeti, Sıcaklık, Akım Şiddeti, Madde Miktarı, Uzunluk, Zaman.",
      "Fiziğin alt dalları (KAMYONET): Katıhal, Atom, Mekanik, Yüksek Enerji, Optik, Nükleer, Elektromanyetizma, Termodinamik.",
    ],
    commonMistakes: [
      "Ağırlığı (vektörel ve türetilmiş) Kütle (skaler ve temel) ile karıştırmak.",
    ],
    strategyTip:
      "KISAMUZ dışındaki tüm büyüklüklerin türetilmiş büyüklük olduğunu hatırlaman soruyu saniyeler içinde çözdürür.",
    questions: [
      {
        question: "Aşağıdakilerden hangisi SI birim sistemindeki temel büyüklüklerden biri değildir?",
        options: ["Kütle", "Sıcaklık", "Kuvvet", "Akım Şiddeti"],
        correctIndex: 2,
        explanation: "Kuvvet (F = m·a) türetilmiş ve vektörel bir büyüklüktür.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-fizik",
    subjectName: "TYT Fizik",
    topicSlug: "madde-ve-ozellikleri",
    title: "Madde ve Özellikleri (Özkütle, Adezyon-Kohezyon)",
    shortDesc:
      "Özkütle (d = m/V), dayanıklılık (1/h), kılcallık, yüzey gerilimi, adezyon ve kohezyon.",
    avgQuestions: "1 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Sabit sıcaklık ve basınç altında özkütle maddeler için ayırt edici özelliktir (d = m / V).",
      "Kohezyon aynı cins moleküllerin birbirini çekmesi, Adezyon farklı cins moleküllerin yapışmasıdır.",
      "Düzgün geometrik katıların kendi ağırlığına karşı dayanıklılığı yükseklikle ters orantılıdır (1/h).",
    ],
    commonMistakes: [
      "Kütle arttıkça özkütlenin de arttığını sanmak (sabit sıcaklıkta kütle ve hacim doğru orantılı artar, özkütle sabit kalır).",
    ],
    strategyTip:
      "Kılcallık sorularında ince boruda suyun daha çok yükseldiğini, cıvada ise kohezyon büyük olduğu için alçalma görüldüğünü unutma.",
    questions: [
      {
        question: "Kütlesi 120 g, hacmi 30 cm³ olan homojen bir maddenin özkütlesi kaç g/cm³'tür?",
        options: ["2", "3", "4", "6"],
        correctIndex: 2,
        explanation: "d = m / V = 120 / 30 = 4 g/cm³.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-fizik",
    subjectName: "TYT Fizik",
    topicSlug: "hareket-ve-kuvvet",
    title: "Hareket, Newton Yasaları ve Sürtünme Kuvveti",
    shortDesc:
      "Konum-hız-ivme grafikleri, alınan yol vs yer değiştirme, F_net = m·a ve sürtünme kuvveti.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Alınan yol skaler, yer değiştirme vektörel büyüklüktür. Sürat = Alınan Yol / Zaman, Hız = Yer Değiştirme / Zaman.",
      "Newton'un 2. Yasası: F_net = m · a.",
      "Statik sürtünme kuvveti cisme uygulanan kuvvete eşit ve zıt yönlüdür (maksimum değerine kadar).",
    ],
    commonMistakes: [
      "Hız-zaman grafiğinin eğiminin yol verdiğini sanmak (eğim ivmeyi, grafiğin altındaki alan ise yer değiştirmeyi verir).",
    ],
    strategyTip:
      "Grafik sorularında eksen isimlerini (Konum-Zaman mı, Hız-Zaman mı?) mutlaka daire içine al.",
    questions: [
      {
        question: "Sürtünmesiz yatay düzlemde duran 4 kg kütleli cisme 20 N net kuvvet uygulanırsa ivmesi kaç m/s² olur?",
        options: ["4", "5", "16", "80"],
        correctIndex: 1,
        explanation: "F_net = m · a → 20 = 4 · a → a = 5 m/s².",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-fizik",
    subjectName: "TYT Fizik",
    topicSlug: "is-guc-enerji",
    title: "İş, Güç ve Mekanik Enerji",
    shortDesc:
      "Fiziksel anlamda iş (W = F·Δx), kinetik-potansiyel enerji, mekanik enerjinin korunumu ve verim.",
    avgQuestions: "1 Soru",
    difficulty: "Orta",
    studyMinutes: 40,
    keyPoints: [
      "Fiziksel iş yapılabilmesi için kuvvet ile yer değiştirme doğrultularının paralel olması gerekir.",
      "Kinetik Enerji: E_k = ½ m·v². Çekim Potansiyel Enerjisi: E_p = m·g·h.",
      "Sürtünmesiz ortamlarda toplam mekanik enerji (E_k + E_p) daima korunur.",
    ],
    commonMistakes: [
      "Elindeki çantayı yatay yolda sabit tutarak yürüyen kişinin yerçekimine karşı iş yaptığını düşünmek (kuvvet dik olduğu için iş 0'dır).",
    ],
    strategyTip:
      "Enerji sorularında ilk durumdaki toplam enerjiyi son durumdaki toplam enerji (+ varsa ısıya dönüşen sürtünme) ile eşitle.",
    questions: [
      {
        question: "2 kg kütleli bir cisim yerden 5 m yükseklikte sabit duruyorsa potansiyel enerjisi kaç Joule'dür? (g = 10 m/s²)",
        options: ["10", "50", "100", "200"],
        correctIndex: 2,
        explanation: "E_p = m · g · h = 2 × 10 × 5 = 100 J.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-fizik",
    subjectName: "TYT Fizik",
    topicSlug: "optik",
    title: "Optik (Gölge, Yansıma, Aynalar, Kırılma ve Mercekler)",
    shortDesc:
      "Düzlem ve küresel aynalar, ışığın kırılması (Snell Yasası), ince/kalın kenarlı mercekler ve renkler.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "İleri",
    studyMinutes: 55,
    keyPoints: [
      "Yansıma kanununa göre gelme açısı yansıma açısına eşittir (açılar normal ile yapılır).",
      "Işık az yoğun ortamdan çok yoğun ortama geçerken normale yaklaşarak kırılır ve hızı azalır.",
      "Işığın ana renkleri: Kırmızı, Yeşil, Mavi (KYM).",
    ],
    commonMistakes: [
      "Gelme açısı olarak ışının ayna yüzeyiyle yaptığı açıyı almak (normalle yaptığı açı alınmalıdır).",
    ],
    strategyTip:
      "Küresel ayna ve merceklerde özel ışınları (odaktan gelen paralel gider, merkezden gelen kendi üzerinden döner) çizerek öğren.",
    questions: [
      {
        question: "Düzlem aynaya ayna yüzeyiyle 30° açı yaparak gelen ışının yansıma açısı kaç derecedir?",
        options: ["30°", "45°", "60°", "90°"],
        correctIndex: 2,
        explanation: "Normal yüzeye dik (90°) olduğundan gelme açısı 90 - 30 = 60°'dir. Yansıma açısı da 60° olur.",
      },
    ],
  },

  // ─── YKS: AYT MATEMATİK ───────────────────────────────────────────────────
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-matematik",
    subjectName: "AYT Matematik",
    topicSlug: "polinomlar-ve-denklemler",
    title: "Polinomlar ve İkinci Dereceden Denklemler",
    shortDesc:
      "Polinomda kalan bulma, kök-katsayı ilişkileri (x₁+x₂ = -b/a, x₁·x₂ = c/a) ve diskriminant (Δ).",
    avgQuestions: "3 - 4 Soru",
    difficulty: "Orta",
    studyMinutes: 55,
    keyPoints: [
      "Bir ifadenin polinom olabilmesi için x'in tüm üsleri doğal sayı (0, 1, 2, ...) olmalıdır.",
      "P(x)'in (x - a) ile bölümünden kalan P(a)'dır.",
      "ax² + bx + c = 0 denkleminde Δ = b² - 4ac > 0 ise iki farklı reel kök, Δ = 0 ise çakışık kök vardır.",
    ],
    commonMistakes: [
      "Polinomun katsayılar toplamını bulurken P(1) yerine sabit terim P(0) hesaplamak.",
    ],
    strategyTip:
      "Katsayılar toplamı = x yerine 1 yaz; Sabit terim = x yerine 0 yaz.",
    questions: [
      {
        question: "P(x) = 2x³ - 4x + 7 polinomunun (x - 2) ile bölümünden kalan kaçtır?",
        options: ["7", "11", "15", "23"],
        correctIndex: 2,
        explanation: "x - 2 = 0 → x = 2. P(2) = 2(8) - 4(2) + 7 = 16 - 8 + 7 = 15.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-matematik",
    subjectName: "AYT Matematik",
    topicSlug: "trigonometri",
    title: "Trigonometri",
    shortDesc:
      "Birim çember, sin²x + cos²x = 1, indirgeme formülleri, toplam-fark ve yarım açı formülleri.",
    avgQuestions: "4 - 5 Soru",
    difficulty: "İleri",
    studyMinutes: 70,
    keyPoints: [
      "Temel özdeşlik: sin²x + cos²x = 1.",
      "sin(2x) = 2·sinx·cosx ve cos(2x) = cos²x - sin²x = 2cos²x - 1 = 1 - 2sin²x.",
      "90° ve 270°'ye göre indirgemelerde fonksiyon isim değiştirir (sin ↔ cos, tan ↔ cot).",
    ],
    commonMistakes: [
      "İndirgeme yaparken yeni açının bulunduğu bölgedeki İLK fonksiyonun işaretini kontrol etmemek.",
    ],
    strategyTip:
      "Bölgelere göre işaretleri (Bütün Sınıflar Kara Tahtada Coşar) önce yaz, sonra isim değişimini uygula.",
    questions: [
      {
        question: "sin(x) = 3/5 ve x birinci bölgede dar açı olduğuna göre cos(x) kaçtır?",
        options: ["1/5", "2/5", "3/4", "4/5"],
        correctIndex: 3,
        explanation: "3-4-5 dik üçgeninden veya sin²x + cos²x = 1 özdeşliğinden cos(x) = 4/5 bulunur.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-matematik",
    subjectName: "AYT Matematik",
    topicSlug: "logaritma-ve-diziler",
    title: "Logaritma ve Diziler",
    shortDesc:
      "Logaritma kuralları, taban değiştirme, üstel denklemler, aritmetik ve geometrik diziler.",
    avgQuestions: "3 - 4 Soru",
    difficulty: "Orta",
    studyMinutes: 55,
    keyPoints: [
      "log_a(b) tanımlı olması için a > 0, a ≠ 1 ve b > 0 şartları sağlanmalıdır.",
      "log(x·y) = log(x) + log(y) ve log(x/y) = log(x) - log(y).",
      "Aritmetik dizide ardışık terim farkı (d), geometrik dizide ardışık terim oranı (r) sabittir.",
    ],
    commonMistakes: [
      "Logaritmalı eşitsizlik çözerken tanım kümesini (logaritma içi > 0) ihmal etmek.",
    ],
    strategyTip:
      "Her logaritma sorusunda ilk adım olarak tanım şartını (taban ≠ 1, taban > 0, içi > 0) kenara not al.",
    questions: [
      {
        question: "log₂(8) + log₃(27) toplamının değeri kaçtır?",
        options: ["5", "6", "7", "9"],
        correctIndex: 1,
        explanation: "log₂(2³) = 3 ve log₃(3³) = 3. Toplam 3 + 3 = 6 olur.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-matematik",
    subjectName: "AYT Matematik",
    topicSlug: "limit-ve-sureklilik",
    title: "Limit ve Süreklilik",
    shortDesc:
      "Sağdan-soldan limit, 0/0 belirsizliği giderme ve fonksiyonun bir noktada süreklilik şartları.",
    avgQuestions: "2 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Bir noktada limitin olması için sağdan limitin soldan limite eşit olması gerekir.",
      "Bir fonksiyonun x = a noktasında sürekli olması için: f(a) tanımlı, limit var ve limit = f(a) olmalıdır.",
      "0/0 belirsizliği çarpanlara ayırma, eşlenik veya L'Hôpital ile giderilir.",
    ],
    commonMistakes: [
      "Limit var olması için fonksiyonun o noktada mutlaka tanımlı olması gerektiğini sanmak (tanımsız olup limiti olabilir).",
    ],
    strategyTip:
      "Parçalı fonksiyon grafiklerinde sıçrama olan noktada limit yoktur, içi boş nokta varsa limit vardır ama süreksizdir.",
    questions: [
      {
        question: "lim (x→3) (x² - 9) / (x - 3) değeri kaçtır?",
        options: ["0", "3", "6", "Tanımsız"],
        correctIndex: 2,
        explanation: "0/0 belirsizliği çarpanlara ayırma ile giderilir: (x-3)(x+3)/(x-3) = x + 3 → 3 + 3 = 6.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-matematik",
    subjectName: "AYT Matematik",
    topicSlug: "turev",
    title: "Türev ve Uygulamaları",
    shortDesc:
      "Türev alma kuralları, teğetin eğimi, artan-azalan aralıklar, ekstremum noktalar ve maksimum-minimum problemleri.",
    avgQuestions: "4 Soru",
    difficulty: "İleri",
    studyMinutes: 70,
    keyPoints: [
      "Bir noktadaki türev değeri o noktadan çizilen teğetin eğimine eşittir: f'(x₀) = m_teğet.",
      "f'(x) > 0 olan aralıklarda fonksiyon artan, f'(x) < 0 olan aralıklarda azalandır.",
      "f'(x) işaret değiştiriyorsa o noktada yerel ekstremum (maksimum veya minimum) vardır.",
    ],
    commonMistakes: [
      "Bir fonksiyonun türevlenebilmesi için önce sürekli olması gerektiğini unutmak (kırılma noktalarında türev yoktur).",
    ],
    strategyTip:
      "Türev grafiği (f') verildiğinde fonksiyonun (f) davranışını anlamak için f' grafiğinin x ekseninin üstünde (+) mi altında (-) mı olduğuna bak.",
    questions: [
      {
        question: "f(x) = x³ - 6x² + 5 fonksiyonunun x = 2 noktasındaki teğetinin eğimi kaçtır?",
        options: ["-12", "-6", "0", "12"],
        correctIndex: 0,
        explanation: "f'(x) = 3x² - 12x. f'(2) = 3(4) - 12(2) = 12 - 24 = -12.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-matematik",
    subjectName: "AYT Matematik",
    topicSlug: "integral",
    title: "Belirsiz ve Belirli İntegral (Alan Hesabı)",
    shortDesc:
      "Ters türev, değişken değiştirme yöntemi, Riemann toplamı ve iki eğri arasındaki alan hesabı.",
    avgQuestions: "4 Soru",
    difficulty: "İleri",
    studyMinutes: 65,
    keyPoints: [
      "∫ xⁿ dx = xⁿ⁺¹ / (n + 1) + C (n ≠ -1).",
      "Belirli integral [a, b] aralığında eğri ile x ekseni arasındaki cebirsel alanı verir.",
      "x ekseninin altında kalan bölgenin alanı negatif çıktığından mutlak değer alınır.",
    ],
    commonMistakes: [
      "Belirsiz integralde + C integral sabitini unutmak.",
      "Alan sorularında x ekseninin altındaki bölgeyi artı almak yerine çıkarıp sıfırlamak.",
    ],
    strategyTip:
      "İki eğri arasındaki alanı hesaplarken daima ∫ (Üstteki Eğri - Alttaki Eğri) dx sırasını kullan.",
    questions: [
      {
        question: "∫₀² 3x² dx belirli integralinin değeri kaçtır?",
        options: ["4", "6", "8", "12"],
        correctIndex: 2,
        explanation: "3x²'nin integrali x³'tür. [x³]₀² = 2³ - 0³ = 8.",
      },
    ],
  },

  // ─── LGS T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK ──────────────────────────────
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "inkilap-tarihi",
    subjectName: "LGS İnkılap Tarihi",
    topicSlug: "bir-kahraman-doguyor",
    title: "Bir Kahraman Doğuyor (20. Yüzyıl Başlarında Osmanlı)",
    shortDesc:
      "Avrupa'daki gelişmeler, fikir akımları (Osmanlıcılık, İslamcılık, Batıcılık, Türkçülük), Mustafa Kemal'in eğitim hayatı ve kişilik özellikleri.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Fransız İhtilali'nin yaydığı milliyetçilik akımı çok uluslu Osmanlı Devleti'ni olumsuz etkiledi.",
      "Selanik; limanı, demiryolu ve çok kültürlü yapısıyla Mustafa Kemal'in fikir hayatını şekillendirdi.",
      "31 Mart Olayı'nı bastıran Hareket Ordusu'nda görev alması meşrutiyet/yenilik yanlısı olduğunu gösterir.",
    ],
    commonMistakes: [
      "Sanayi İnkılabı (sömürgecilik/hammadde) ile Fransız İhtilali'ni (milliyetçilik/demokrasi) karıştırmak.",
    ],
    strategyTip:
      "Mustafa Kemal'in sözü veya olay verilen sorularda 'ileri görüşlülük, vatanseverlik, çok yönlülük, teşkilatçılık' kavramlarını paragraftaki ipucuyla doğrudan eşleştir.",
    questions: [
      {
        question: "Mustafa Kemal'in 'Vatan ve Hürriyet Cemiyeti'ni kurması hangi kişilik özelliğini doğrudan gösterir?",
        options: ["Teşkilatçılık ve vatanseverlik", "Sanatseverlik", "Sabırsızlık", "İleri görüşlülük"],
        correctIndex: 0,
        explanation: "Cemiyet kurmak ve insanları bir amaç etrafında örgütlemek teşkilatçılık özelliğini gösterir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "inkilap-tarihi",
    subjectName: "LGS İnkılap Tarihi",
    topicSlug: "milli-uyanis",
    title: "Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar",
    shortDesc:
      "I. Dünya Savaşı cepheleri, Mondros Ateşkesi, cemiyetler, Havza-Amasya Genelgeleri, Erzurum-Sivas Kongreleri ve Misak-ı Millî.",
    avgQuestions: "3 - 4 Soru",
    difficulty: "Orta",
    studyMinutes: 50,
    keyPoints: [
      "Amasya Genelgesi'nde 'Milletin bağımsızlığını yine milletin azim ve kararı kurtaracaktır' maddesiyle ilk kez millî egemenlik vurgulanmıştır.",
      "Erzurum Kongresi toplanış bakımından bölgesel, aldığı kararlar bakımından ulusaldır; ilk kez 'manda ve himaye kabul edilemez' denmiştir.",
      "Sivas Kongresi'nde tüm millî cemiyetler 'Anadolu ve Rumeli Müdafaa-i Hukuk Cemiyeti' adıyla birleştirilmiştir.",
    ],
    commonMistakes: [
      "Millî bağımsızlık (vatanın kurtuluşu) ile millî egemenlik (halkın yönetimi/cumhuriyet) kavramlarını birbirine karıştırmak.",
    ],
    strategyTip:
      "Kronoloji sorularında Havza → Amasya → Erzurum → Sivas → Amasya Görüşmeleri → Son Osmanlı Mebusan Meclisi (Misak-ı Millî) → TBMM'nin Açılışı sırasını net tut.",
    questions: [
      {
        question: "Tüm millî cemiyetlerin tek çatı altında birleştirildiği kongre aşağıdakilerden hangisidir?",
        options: ["Erzurum Kongresi", "Sivas Kongresi", "Balıkesir Kongresi", "Alaşehir Kongresi"],
        correctIndex: 1,
        explanation: "Sivas Kongresi'nde yurdun dört bir yanındaki yararlı cemiyetler tek çatı altında birleştirilmiştir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "inkilap-tarihi",
    subjectName: "LGS İnkılap Tarihi",
    topicSlug: "milli-bir-destan",
    title: "Millî Bir Destan: Ya İstiklal Ya Ölüm!",
    shortDesc:
      "Doğu-Güney-Batı cepheleri, Sakarya Meydan Muharebesi, Büyük Taarruz, Mudanya ve Lozan Barış Antlaşması.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Doğu Cephesi Gümrü Antlaşması ile, Güney Cephesi Ankara Antlaşması ile, Batı Cephesi Mudanya Ateşkesi ile kapanmıştır.",
      "Kütahya-Eskişehir savaşlarından sonra Tekâlif-i Millîye Emirleri çıkarılarak ordunun ihtiyaçları halktan karşılanmıştır.",
      "Lozan Barış Antlaşması ile kapitülasyonlar kesin olarak kaldırılmış ve Türkiye'nin bağımsızlığı dünyaca tanınmıştır.",
    ],
    commonMistakes: [
      "Maarif Kongresi'nin barış döneminde yapıldığını sanmak (Kütahya-Eskişehir Savaşları sürerken toplanmıştır).",
    ],
    strategyTip:
      "Savaşların diplomatik sonuçlarını eşleştir: I. İnönü → Londra Konferansı / Moskova Ant., Sakarya → Kars / Ankara Ant., Büyük Taarruz → Mudanya.",
    questions: [
      {
        question: "TBMM'yi tanıyan ilk devlet aşağıdakilerden hangisidir?",
        options: ["Fransa", "İngiltere", "Ermenistan (Gümrü Antlaşması)", "İtalya"],
        correctIndex: 2,
        explanation: "Doğu Cephesi sonunda imzalanan Gümrü Antlaşması ile TBMM'yi tanıyan ilk devlet Ermenistan olmuştur.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "inkilap-tarihi",
    subjectName: "LGS İnkılap Tarihi",
    topicSlug: "ataturkculuk-ve-inkilaplar",
    title: "Atatürkçülük, İlkeler ve İnkılaplar",
    shortDesc:
      "6 temel Atatürk ilkesi (Cumhuriyetçilik, Milliyetçilik, Halkçılık, Devletçilik, Laiklik, İnkılapçılık) ve yapılan inkılaplar.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Temel",
    studyMinutes: 45,
    keyPoints: [
      "Cumhuriyetçilik: Ulusal egemenlik, seçim, meclis, çok partili hayat.",
      "Halkçılık: Eşitlik, toplumsal dayanışma, aşar vergisinin kaldırılması, Soyadı Kanunu.",
      "Laiklik: Din ve devlet işlerinin ayrılması, akıl ve bilimin rehber alınması.",
      "Devletçilik: Özel sektörün yetersiz kaldığı alanlarda ekonomide devletin yatırım yapması.",
    ],
    commonMistakes: [
      "Aşar vergisinin kaldırılmasını sadece Devletçilikle ilişkilendirmek (köylüyü rahatlattığı için doğrudan Halkçılıktır).",
    ],
    strategyTip:
      "Anahtar kelime yöntemi: Seçim/Meclis = Cumhuriyetçilik; Eşitlik/Ayrıcalıksız toplum = Halkçılık; Akıl/Bilim/Din özgürlüğü = Laiklik; Fabrika/Kalkınma = Devletçilik.",
    questions: [
      {
        question: "Medeni Kanun'un kabulü ile kadın-erkek eşitliğinin sosyal ve hukuki alanda sağlanması en çok hangi iki ilkeyle ilgilidir?",
        options: [
          "Devletçilik - Milliyetçilik",
          "Halkçılık - Laiklik",
          "Devletçilik - Cumhuriyetçilik",
          "Milliyetçilik - Devletçilik",
        ],
        correctIndex: 1,
        explanation: "Eşitlik sağladığı için Halkçılık, hukuku din kurallarından ayırıp akıl/çağdaş hukuka dayandırdığı için Laiklik ilkesiyle ilgilidir.",
      },
    ],
  },

  // ─── LGS İNGİLİZCE ────────────────────────────────────────────────────────
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "ingilizce",
    subjectName: "LGS İngilizce",
    topicSlug: "friendship-unit-1",
    title: "Unit 1: Friendship (Davet Etme, Kabul ve Reddetme)",
    shortDesc:
      "Accepting and refusing invitations, making excuses, personality traits (honest, supportive, laid-back) ve soru kalıpları.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Temel",
    studyMinutes: 30,
    keyPoints: [
      "Davet kalıpları: 'Would you like to...?', 'How about + V-ing?', 'Shall we...?', 'Why don't we...?'",
      "Kabul: 'Sure, that sounds awesome!', 'I'd love to.', 'Why not?'",
      "Reddetme + Mazeret: 'I'd love to, but I must...', 'I'm sorry, I can't make it.'",
    ],
    commonMistakes: [
      "'Why not?' ifadesini 'Neden olmasın?' (kabul) yerine 'Hayır' (red) sanmak.",
    ],
    strategyTip:
      "Diyalog sorularında boşluktan sonraki cümlede 'mazeret (excuse)' varsa mutlaka reddetme ifadesi seç.",
    questions: [
      {
        question: "Ali: 'Would you like to join my slumber party tonight?' — Can: '____. I have to finish my science project.' Boşluğa hangisi gelmelidir?",
        options: [
          "Sure, it sounds great",
          "I'd love to, but I can't",
          "Yes, I'll definitely be there",
          "Why not? See you tonight",
        ],
        correctIndex: 1,
        explanation: "Devamında mazeret ('fen projemi bitirmeliyim') geldiği için nazikçe reddetme kalıbı seçilmelidir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "ingilizce",
    subjectName: "LGS İngilizce",
    topicSlug: "teen-life-and-kitchen",
    title: "Unit 2-3: Teen Life & In the Kitchen",
    shortDesc:
      "Günlük rutinler, müzik/kitap tercihleri (prefer), yemek tarifleri ve pişirme yöntemleri (boil, fry, bake, grill, steam).",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Sıralama bağlaçları (Sequencing): First → Second → Next → After that → Finally.",
      "'Prefer A to B': A'yı B'ye tercih etmek. Fiil gelirse V-ing alır ('I prefer reading to watching TV').",
      "Pişirme yöntemleri: Boil (haşlamak), Fry (kızartmak), Bake (fırında pişirmek), Grill (ızgara), Steam (buharda).",
    ],
    commonMistakes: [
      "Tarif sorularında 'First' ve 'Finally' ipuçlarına bakmadan sıralamayı karıştırmak.",
    ],
    strategyTip:
      "Yemek tarifi sorularında 'First' ile başlayan adımı en başa, 'Finally / Serve hot' içeren adımı en sona koyarak şıkları hızla ele.",
    questions: [
      {
        question: "Which cooking method uses hot water in a pot?",
        options: ["Grill", "Bake", "Boil", "Roast"],
        correctIndex: 2,
        explanation: "'Boil' tencerede kaynar su kullanarak haşlamak anlamına gelir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "ingilizce",
    subjectName: "LGS İngilizce",
    topicSlug: "on-the-phone-and-internet",
    title: "Unit 4-5: On the Phone & The Internet",
    shortDesc:
      "Telefon konuşması kalıpları (hold on, put through, leave a message) ve internet güvenliği / alışkanlıkları.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Orta",
    studyMinutes: 35,
    keyPoints: [
      "'Hold on a moment' (bir dakika bekleyin), 'I'll put you through' (sizi bağlıyorum), 'He is not available' (müsait değil).",
      "İnternet kelimeleri: Attachment (ek), Download/Upload, Browser, Confirm, Account, Password.",
    ],
    commonMistakes: [
      "'Hang on' (bekle) ile 'Hang up' (telefonu kapat) ifadelerini karıştırmak.",
    ],
    strategyTip:
      "Telefon diyaloğunda aranan kişi evde/ofiste değilse devamında genellikle 'Would you like to leave a message?' sorusu gelir.",
    questions: [
      {
        question: "Secretary: 'Hold on, please. I will ____ you ____ to the manager.'",
        options: ["hang / up", "put / through", "call / back", "pick / up"],
        correctIndex: 1,
        explanation: "'put someone through' birini telefonda başka birine bağlamak anlamında kullanılır.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "ingilizce",
    subjectName: "LGS İngilizce",
    topicSlug: "adventures-and-tourism",
    title: "Unit 6-7: Adventures & Tourism",
    shortDesc:
      "Ekstrem sporlar, karşılaştırmalar (comparatives), tatil türleri ve Present Perfect Tense (Have you ever...?).",
    avgQuestions: "2 Soru",
    difficulty: "Orta",
    studyMinutes: 35,
    keyPoints: [
      "Karşılaştırma: Tek heceliler '-er than', uzun sıfatlar 'more ... than' alır.",
      "'Have you ever been to ...?': Hayatında hiç ... bulundun mu? (Deneyim sorusu).",
      "Turizm kelimeleri: Accommodation (konaklama), Historic site, All-inclusive, Souvenir.",
    ],
    commonMistakes: [
      "'Been to' (gidip dönmüş olmak) ile 'Gone to' (gitmiş, hâlâ orada olmak) farkını kaçırmak.",
    ],
    strategyTip:
      "Grafik/tablo sorularında 'prefer', 'more thrilling than', 'safer than' gibi karşılaştırma kalıplarını sayısal verilerle tek tek doğrula.",
    questions: [
      {
        question: "I think skydiving is ____ than trekking because it involves jumping from a plane.",
        options: ["more dangerous", "safer", "easier", "more boring"],
        correctIndex: 0,
        explanation: "Uçaktan atlamayı içerdiği için skydiving (gökyüzü dalışı) trekking'e göre daha tehlikelidir (more dangerous).",
      },
    ],
  },

  // ─── LGS DİN KÜLTÜRÜ VE AHLAK BİLGİSİ ───────────────────────────────────
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "din-kulturu",
    subjectName: "LGS Din Kültürü",
    topicSlug: "kader-inanci",
    title: "Kader İnancı (Kaza, Kader, Evrenin Yasaları, Tevekkül)",
    shortDesc:
      "Fiziksel, biyolojik ve toplumsal yasalar (Sünnetullah), külli-cüzi irade, emek-rızık ve doğru tevekkül anlayışı.",
    avgQuestions: "3 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Fiziksel yasalar madde ve enerjiyle (suyun kaynaması, yerçekimi); Biyolojik yasalar canlıların yapısıyla (fotosentez, üreme); Toplumsal yasalar insan ilişkileriyle (adalet, göç) ilgilidir.",
      "Cüzi irade insanın kendi özgür seçimidir ve sorumluluğu insana aittir.",
      "Tevekkül: Önce elinden gelen tüm çabayı göstermek, ardından Allah'a güvenmektir (tedbir + dua).",
    ],
    commonMistakes: [
      "Tevekkülü hiçbir çaba göstermeden sadece beklemek sanmak.",
    ],
    strategyTip:
      "Ayet verilen sorularda 'ölçü, düzen, denge' geçiyorsa Evrensel Yasalar; 'tercih, sorumluluk' geçiyorsa Cüzi İrade şıkkına odaklan.",
    questions: [
      {
        question: "Kur'an-ı Kerim'de adalet, kul hakkı ve toplumsal dayanışmayı konu alan yasalar hangi kapsamdadır?",
        options: ["Fiziksel yasalar", "Biyolojik yasalar", "Toplumsal yasalar", "Kimyasal yasalar"],
        correctIndex: 2,
        explanation: "Toplumun huzur ve düzenini sağlayan kurallar Toplumsal Yasalar kapsamına girer.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "din-kulturu",
    subjectName: "LGS Din Kültürü",
    topicSlug: "zekat-ve-sadaka",
    title: "Zekât ve Sadaka İbadeti",
    shortDesc:
      "Nisap miktarı, zekât oranları (1/40, 1/30, 1/10), kimlere verilir, sadaka-i cariye ve fitre.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Zekât farzdır ve nisap miktarı (temel ihtiyaçlar hariç 85 g altın veya dengi mal) zenginliğe sahip olanlarca yılda bir kez verilir.",
      "Altın, gümüş, nakit para ve ticaret mallarında zekât oranı 1/40 (%2,5)'tir.",
      "Sadaka-i Cariye: İnsan öldükten sonra da sevabı devam eden kalıcı hayır işleridir (okul, çeşme, ağaç, hayırlı evlat, ilmi eser).",
    ],
    commonMistakes: [
      "Zekâtın anne, baba, eş, çocuk ve torunlara verilebileceğini sanmak (bakmakla yükümlü olunan kişilere zekât verilmez).",
    ],
    strategyTip:
      "Kimlere zekât verilmez? 'Bakmakla yükümlü oldukların + Zenginler'. Bu iki grubu elemen yeterli.",
    questions: [
      {
        question: "80.000 TL nakit birikimi olan ve nisap şartını taşıyan bir kişi yılda kaç TL zekât vermelidir?",
        options: ["1.000 TL", "2.000 TL", "4.000 TL", "8.000 TL"],
        correctIndex: 1,
        explanation: "Nakit parada zekât oranı 1/40 (%2,5)'tir. 80.000 / 40 = 2.000 TL olur.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "din-kulturu",
    subjectName: "LGS Din Kültürü",
    topicSlug: "din-ve-hayat",
    title: "Din ve Hayat (Zarurat-ı Hamse: 5 Temel Değer)",
    shortDesc:
      "Canın, aklın, neslin, malın ve dinin korunması ilkeleri; İslam'ın birey ve toplum hayatına katkıları.",
    avgQuestions: "2 Soru",
    difficulty: "Temel",
    studyMinutes: 30,
    keyPoints: [
      "İslam'ın korunmasını esas aldığı 5 temel ilke: Can, Akıl, Nesil, Mal ve Din güvenliği.",
      "Zararlı alışkanlıklardan kaçınmak aklın ve canın korunmasına; hırsızlık/faiz yasağı malın korunmasına; aile kurumu neslin korunmasına örnektir.",
    ],
    commonMistakes: [
      "İş sağlığı ve güvenliği önlemlerini sadece mal güvenliği sanmak (öncelikle Canın Korunması ilkesidir).",
    ],
    strategyTip:
      "Paragraftaki yasağı veya tavsiyeyi oku: 'Zarar verici içecekler' → Akıl; 'Alın teri/Ticaret ahlakı' → Mal; 'Aile' → Nesil.",
    questions: [
      {
        question: "Trafik kurallarına uymak ve iş güvenliği önlemleri almak öncelikle hangi temel hakkın korunmasına yöneliktir?",
        options: ["Malın korunması", "Canın korunması", "Dinin korunması", "Neslin korunması"],
        correctIndex: 1,
        explanation: "İnsan yaşamını ve sağlığını korumayı amaçlayan kurallar Canın Korunması ilkesiyle ilgilidir.",
      },
    ],
  },
  {
    exam: "lgs",
    examLabel: "LGS (8. Sınıf)",
    subjectSlug: "din-kulturu",
    subjectName: "LGS Din Kültürü",
    topicSlug: "hz-muhammedin-ornekligi",
    title: "Hz. Muhammed'in Örnekliği (Muhammedü'l-Emîn)",
    shortDesc:
      "Doğruluk ve güvenilirlik, merhamet, istişare (danışma), kararlılık, hak gözetme ve Kureyş Suresi/Maun Suresi mesajları.",
    avgQuestions: "2 Soru",
    difficulty: "Temel",
    studyMinutes: 30,
    keyPoints: [
      "Hz. Muhammed'e dürüstlüğü ve emanete sahip çıkması nedeniyle 'Muhammedü'l-Emîn' (Güvenilir Muhammed) denmiştir.",
      "Bedir, Uhud ve Hendek savaşları öncesinde arkadaşlarının fikrini alması 'istişare'ye verdiği önemi gösterir.",
    ],
    commonMistakes: [
      "İstişare kavramını tek başına karar vermekle karıştırmak (danışarak ortak akıl üretmektir).",
    ],
    strategyTip:
      "Olay metinlerinde arkadaşlarına danışma varsa İstişare, sözünde durma varsa Güvenilirlik, affetme varsa Merhamet seç.",
    questions: [
      {
        question: "Hendek Savaşı'nda Selman-ı Farisî'nin hendek kazma önerisinin kabul edilmesi Hz. Muhammed'in hangi özelliğini yansıtır?",
        options: ["İstişareye önem vermesi", "Yalnız karar alması", "Ticaret bilgisi", "Sabırsızlığı"],
        correctIndex: 0,
        explanation: "Sahabelerin görüşlerini dinleyip en uygun fikri uygulaması istişareye (danışmaya) verdiği önemi gösterir.",
      },
    ],
  },

  // ─── YKS GEOMETRİ ─────────────────────────────────────────────────────────
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "geometri",
    subjectName: "YKS Geometri",
    topicSlug: "ucgende-acilar-ve-alan",
    title: "Doğruda ve Üçgende Açılar, Açıortay-Kenarortay ve Alan",
    shortDesc:
      "Z-M-U kuralları, ikizkenar/eşkenar üçgen, muhteşem üçlü, 30-60-90 üçgeni ve üçgende alan bölme.",
    avgQuestions: "4 - 5 Soru",
    difficulty: "Orta",
    studyMinutes: 60,
    keyPoints: [
      "Dik üçgende hipotenüse ait kenarortay hipotenüsün yarısına eşittir (Muhteşem Üçlü).",
      "30°-60°-90° üçgeninde kenarlar a, a√3, 2a oranındadır.",
      "Yükseklikleri eşit olan üçgenlerin alanları oranı tabanları oranına eşittir.",
    ],
    commonMistakes: [
      "İkizkenar üçgende tepe açısından indirilen yüksekliğin hem açıortay hem kenarortay olduğunu (YA-Kİ) görmemek.",
    ],
    strategyTip:
      "Açıortay ve paralelliğin bir arada olduğu her soruda Z kuralı ile ikizkenar üçgen yakalarsın!",
    questions: [
      {
        question: "Bir dik üçgende hipotenüs uzunluğu 12 cm ise hipotenüse ait kenarortay uzunluğu kaç cm'dir?",
        options: ["4", "6", "8", "12"],
        correctIndex: 1,
        explanation: "Muhteşem üçlü kuralına göre hipotenüse ait kenarortay hipotenüsün yarısıdır: 12 / 2 = 6 cm.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "geometri",
    subjectName: "YKS Geometri",
    topicSlug: "cokgenler-ve-dortgenler",
    title: "Çokgenler ve Özel Dörtgenler (Paralelkenar, Eşkenar Dörtgen, Yamuk)",
    shortDesc:
      "İç-dış açılar toplamı, yamukta orta taban, paralelkenar alan paylaşımı ve deltoid-kare-dikdörtgen.",
    avgQuestions: "3 - 4 Soru",
    difficulty: "Orta",
    studyMinutes: 55,
    keyPoints: [
      "Tüm çokgenlerin dış açıları toplamı daima 360°'dir.",
      "Yamukta orta taban = (Alt Taban + Üst Taban) / 2.",
      "Eşkenar dörtgende köşegenler dik kesişir ve açıortaydır.",
    ],
    commonMistakes: [
      "Yamuk sorularında üst köşeden paralel veya dik indirmeden açı-kenar aramaya çalışmak.",
    ],
    strategyTip:
      "Çokgenlerde iç açı formülü yerine önce Dış Açı = 360° / n formülünü kullanmak işlemleri çok kısaltır.",
    questions: [
      {
        question: "Bir düzgün çokgenin bir dış açısı 30° olduğuna göre bu çokgen kaç kenarlıdır?",
        options: ["8", "10", "12", "15"],
        correctIndex: 2,
        explanation: "n = 360° / 30° = 12 kenarlıdır.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "geometri",
    subjectName: "YKS Geometri",
    topicSlug: "cember-ve-daire",
    title: "Çemberde Açılar, Uzunluk ve Dairede Alan",
    shortDesc:
      "Merkez açı, çevre açı, teğet-kiriş açı, kiriş özellikler ve daire dilimi alanı.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "İleri",
    studyMinutes: 55,
    keyPoints: [
      "Çapı gören çevre açı daima 90°'dir.",
      "Merkezden kirişe indirilen dikme kirişi iki eşit parçaya böler.",
      "Merkezden teğet değme noktasına çizilen yarıçap teğete diktir.",
    ],
    commonMistakes: [
      "Çevre açının gördüğü yayın yarısına eşit olduğunu unutup merkez açıyla karıştırmak.",
    ],
    strategyTip:
      "Çemberde uzunluk sorularında ilk iş: Merkezden teğete dik çiz, merkezden kirişe dik indir!",
    questions: [
      {
        question: "Yarıçapı 6 cm olan bir dairenin 60°'lik diliminin alanı kaç π cm²'dir?",
        options: ["3π", "6π", "9π", "12π"],
        correctIndex: 1,
        explanation: "Alan = π·r²·(α/360) = π·36·(60/360) = 6π cm².",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "geometri",
    subjectName: "YKS Geometri",
    topicSlug: "analitik-geometri",
    title: "Noktanın ve Doğrunun Analitiği",
    shortDesc:
      "İki nokta arası uzaklık, orta nokta, eğim, paralel-dik doğrular ve noktanın doğruya uzaklığı.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "İleri",
    studyMinutes: 55,
    keyPoints: [
      "İki nokta arası uzaklık: |AB| = √[(x₂ - x₁)² + (y₂ - y₁)²].",
      "Dik kesişen iki doğrunun eğimleri çarpımı -1'dir: m₁ · m₂ = -1.",
      "Paralel doğruların eğimleri birbirine eşittir: m₁ = m₂.",
    ],
    commonMistakes: [
      "Dik doğruların eğimlerinin çarpımını +1 almak.",
    ],
    strategyTip:
      "Koordinat düzleminde alan veya uzunluk sorularında dik üçgen benzerliği (eş üçgen) kurmak çoğu soruyu formülsüz çözer.",
    questions: [
      {
        question: "Eğimi 2 olan bir doğruya dik olan doğrunun eğimi kaçtır?",
        options: ["-2", "-1/2", "1/2", "2"],
        correctIndex: 1,
        explanation: "m₁ · m₂ = -1 olduğundan 2 · m₂ = -1 → m₂ = -1/2.",
      },
    ],
  },

  // ─── YKS: TYT KİMYA ───────────────────────────────────────────────────────
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-kimya",
    subjectName: "TYT Kimya",
    topicSlug: "kimya-bilimi-ve-atom",
    title: "Kimya Bilimi, Atom Modelleri ve Atomun Yapısı",
    shortDesc:
      "Simya-kimya farkı, güvenlik işaretleri, Dalton-Thomson-Rutherford-Bohr modelleri, izotop-izoton-izobar.",
    avgQuestions: "2 Soru",
    difficulty: "Temel",
    studyMinutes: 40,
    keyPoints: [
      "Kütle Numarası (A) = Proton Sayısı (Z) + Nötron Sayısı (N).",
      "İzotop atomların proton sayıları aynı, nötron ve kütle numaraları farklıdır.",
      "Bir atom elektron verdikçe çapı küçülür (katyon), elektron aldıkça çapı büyür (anyon).",
    ],
    commonMistakes: [
      "İzotop atomların fiziksel özelliklerinin de aynı olduğunu düşünmek (kimyasal özellikleri aynı, fiziksel özellikleri farklıdır).",
    ],
    strategyTip:
      "Atom numarasının sol alt köşeye, yükün sağ üst köşeye yazıldığını sabitle; iyon yükü + elektron sayısı = proton sayısıdır.",
    questions: [
      {
        question: "Proton sayısı 12, nötron sayısı 12 olan Mg²⁺ iyonunun elektron sayısı kaçtır?",
        options: ["10", "12", "14", "24"],
        correctIndex: 0,
        explanation: "2 elektron verdiği için 12 - 2 = 10 elektronu vardır.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-kimya",
    subjectName: "TYT Kimya",
    topicSlug: "periyodik-sistem-ve-baglar",
    title: "Periyodik Sistem ve Kimyasal Türler Arası Etkileşimler",
    shortDesc:
      "İyonlaşma enerjisi (3 aşağı 5 yukarı), elektronegatiflik, iyonik-kovalent-metalik bağlar ve zayıf etkileşimler.",
    avgQuestions: "2 - 3 Soru",
    difficulty: "Orta",
    studyMinutes: 50,
    keyPoints: [
      "Aynı periyotta soldan sağa doğru atom yarıçapı genellikle azalır, iyonlaşma enerjisi genellikle artar (2A > 3A, 5A > 6A istisnası).",
      "Hidrojen bağı: H atomunun F, O, N atomlarından birine bağlı olduğu polar moleküller arasında görülür.",
    ],
    commonMistakes: [
      "Hidrojen içeren her bileşikte (ör. HCl veya CH₄) hidrojen bağı olduğunu sanmak (yalnızca F, O, N ile doğrudan bağlıysa vardır).",
    ],
    strategyTip:
      "Zayıf etkileşimler (Hidrojen bağı, Dipol-dipol, London) fiziksel bağlardır; kaynama noktasını belirlerler.",
    questions: [
      {
        question: "Aşağıdaki moleküllerden hangisinin kendi molekülleri arasında hidrojen bağı görülür?",
        options: ["CH₄", "HCl", "H₂O", "CO₂"],
        correctIndex: 2,
        explanation: "H₂O'da H atomu doğrudan Oksijen'e bağlı olduğu için moleküller arası hidrojen bağı bulunur.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-kimya",
    subjectName: "TYT Kimya",
    topicSlug: "maddenin-halleri-ve-karisimlar",
    title: "Maddenin Halleri ve Karışımların Ayrılması",
    shortDesc:
      "Buhar basıncı, kaynama noktası, homojen-heterojen karışımlar, koligatif özellikler ve ayırma teknikleri.",
    avgQuestions: "2 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Buhar basıncı yalnızca sıvının cinsine, sıcaklığına ve safsızlığına bağlıdır (dış basınca bağlı değildir).",
      "Sıvı-sıvı homojen karışımlar (alkol-su) ayrımsal damıtma ile; heterojen sıvı-sıvı karışımlar (zeytinyağı-su) ayırma hunisi ile ayrılır.",
    ],
    commonMistakes: [
      "Kaynama noktası ile buhar basıncını doğru orantılı sanmak (aynı sıcaklıkta kaynama noktası büyük olanın buhar basıncı düşüktür).",
    ],
    strategyTip:
      "Suya tuz eklendiğinde kaynama noktası yükselir, donma noktası alçalır (koligatif özellik).",
    questions: [
      {
        question: "Zeytinyağı ve su karışımını ayırmak için hangi yöntem kullanılır?",
        options: ["Ayrımsal damıtma", "Ayırma hunisi", "Süzme", "Mıknatıslama"],
        correctIndex: 1,
        explanation: "Birbiri içinde çözünmeyen yoğunlukları farklı iki sıvıyı ayırmak için ayırma hunisi kullanılır.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-kimya",
    subjectName: "TYT Kimya",
    topicSlug: "asitler-bazlar-tuzlar",
    title: "Asitler, Bazlar ve Tuzlar",
    shortDesc:
      "Asit-baz tepkimeleri (nötralleşme), aktif-yarı soy-soy metallerin tepkimeleri ve günlük yaşam kimyasalları.",
    avgQuestions: "1 Soru",
    difficulty: "Orta",
    studyMinutes: 40,
    keyPoints: [
      "Aktif metaller asitlerle tepkimeye girerek H₂ gazı açığa çıkarır.",
      "Yarı soy metaller (Cu, Hg, Ag) yalnızca oksijenli kuvvetli asitlerle (HNO₃, H₂SO₄) tepkime verir.",
      "Amfoter metaller (Zn, Al, Cr, Sn, Pb, Be) hem asitlerle hem kuvvetli bazlarla tepkime verir.",
    ],
    commonMistakes: [
      "Bakır (Cu) metalinin HCl asidi ile tepkime vereceğini sanmak (Cu yarı soy metaldir, HCl ile tepkime vermez).",
    ],
    strategyTip:
      "'Zengin Pablo Cariyesine Al Beni' kodlamasıyla amfoter metalleri (Zn, Pb, Cr, Al, Be) kolayca hatırla.",
    questions: [
      {
        question: "Hangi metal hem kuvvetli asitlerle hem de kuvvetli bazlarla tepkimeye girerek H₂ gazı açığa çıkarır?",
        options: ["Cu (Bakır)", "Au (Altın)", "Al (Alüminyum)", "Ag (Gümüş)"],
        correctIndex: 2,
        explanation: "Alüminyum (Al) amfoter bir metal olduğu için hem asitlerle hem de kuvvetli bazlarla H₂ gazı oluşturur.",
      },
    ],
  },

  // ─── YKS: TYT BİYOLOJİ ────────────────────────────────────────────────────
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-biyoloji",
    subjectName: "TYT Biyoloji",
    topicSlug: "canlilarin-temel-bilesenleri",
    title: "Canlıların Ortak Özellikleri ve Temel Bileşenleri",
    shortDesc:
      "Karbonhidratlar, lipitler, proteinler, enzimler, vitaminler ve nükleik asitler.",
    avgQuestions: "2 Soru",
    difficulty: "Temel",
    studyMinutes: 45,
    keyPoints: [
      "Enerji verici olarak kullanım sırası: Karbonhidrat → Yağ → Protein. Birim gram başına en çok enerji veren: Yağ.",
      "Enzimler aktivasyon enerjisini düşürür, tepkimeden değişmeden çıkarlar ve sıcaklık-pH değişimlerinden etkilenirler.",
      "Vitaminler enerji vermez, düzenleyicidirler; A, D, E, K yağda; B ve C suda çözünür.",
    ],
    commonMistakes: [
      "Vitaminlerin sindirime uğradığını veya enerji verdiğini sanmak (küçük yapılıdırlar, sindirilmezler).",
    ],
    strategyTip:
      "Enzim sorularında yüksek sıcaklığın (55°C+) protein yapıyı kalıcı bozduğunu (denatürasyon), 0°C'nin ise yalnızca geçici durdurduğunu unutma.",
    questions: [
      {
        question: "Aşağıdaki moleküllerden hangisi hücrede enerji verici olarak KULLANILMAZ?",
        options: ["Glikoz", "Trigliserit (Yağ)", "Protein", "Vitamin"],
        correctIndex: 3,
        explanation: "Vitaminler, mineraller ve su enerji verici değil düzenleyici bileşiklerdir.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-biyoloji",
    subjectName: "TYT Biyoloji",
    topicSlug: "hucre-ve-organeller",
    title: "Hücre Zarı, Madde Geçişleri ve Organeller",
    shortDesc:
      "Prokaryot-ökaryot farkı, difüzyon, osmoz, aktif taşıma, endositoz-ekzositoz ve organel görevleri.",
    avgQuestions: "1 - 2 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Pasif taşıma (difüzyon, osmoz) çok yoğun ortamdan az yoğun ortama ATP harcanmadan gerçekleşir.",
      "Aktif taşıma az yoğundan çoka doğru ATP harcanarak ve canlı hücrelerde gerçekleşir.",
      "Ribozom zarsız bir organeldir ve hem prokaryot hem ökaryot tüm canlı hücrelerde bulunur.",
    ],
    commonMistakes: [
      "Bitki ve mantar hücrelerinin hücre duvarı yüzünden endositoz yapabileceğini düşünmek (çeper endositoza izin vermez).",
    ],
    strategyTip:
      "Hücre hipertonik (çok yoğun) ortama konursa su kaybedip büzülür (plazmoliz), hipotonik ortamda su alıp şişer.",
    questions: [
      {
        question: "Tüm canlı hücrelerde (prokaryot ve ökaryot) ortak olarak bulunan organel hangisidir?",
        options: ["Mitokondri", "Ribozom", "Golgi aygıtı", "Kloroplast"],
        correctIndex: 1,
        explanation: "Protein sentezini gerçekleştiren Ribozom tüm prokaryot ve ökaryot hücrelerde ortaktır.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-biyoloji",
    subjectName: "TYT Biyoloji",
    topicSlug: "mitoz-ve-mayoz",
    title: "Hücre Bölünmeleri (Mitoz, Mayoz ve Eşeysiz Üreme)",
    shortDesc:
      "İnterfaz, mitoz evreleri, mayoz I-II, krossing over, kromozom sayısı ve DNA miktarı grafikleri.",
    avgQuestions: "1 Soru",
    difficulty: "Orta",
    studyMinutes: 40,
    keyPoints: [
      "Mitozda 2n kromozomlu 1 hücreden kalıtsal yapısı aynı 2n kromozomlu 2 hücre oluşur.",
      "Mayoz I'de homolog kromozomlar ayrıldığı için kromozom sayısı yarıya iner (2n → n) ve krossing over ile çeşitlilik sağlanır.",
    ],
    commonMistakes: [
      "DNA eşlenmesinin (interfaz) Mayoz II öncesinde de gerçekleştiğini sanmak (DNA yalnızca Mayoz I öncesinde eşlenir).",
    ],
    strategyTip:
      "Mayoz bölünme sorularında 'homolog kromozom ayrılması' = Mayoz I, 'kardeş kromatit ayrılması' = Mayoz II (ve Mitoz) ayrımını kullan.",
    questions: [
      {
        question: "Mayoz bölünmede kalıtsal çeşitliliği sağlayan krossing over (parça değişimi) hangi evrede gerçekleşir?",
        options: ["Profaz I", "Metafaz I", "Anafaz II", "Telofaz II"],
        correctIndex: 0,
        explanation: "Krossing over ve sinapsis olayları Mayoz I'in Profaz I evresinde gerçekleşir.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-biyoloji",
    subjectName: "TYT Biyoloji",
    topicSlug: "kalitim-ve-ekosistem",
    title: "TYT Kalıtım, Soyağacı ve Ekosistem Ekolojisi",
    shortDesc:
      "Soyağacı analizleri, eş baskınlık, X'e bağlı kalıtım, besin zinciri, biyolojik birikim ve madde döngüleri.",
    avgQuestions: "2 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Besin piramidinde üreticiden son tüketiciye doğru gidildikçe aktarılan enerji azalır (%10 kuralı), biyolojik birikim (zehirli madde) artar.",
      "Otozomal çekinik özellikte (ör. aa) anne ve baba taralı değilken çocuk taralıysa, anne-baba kesinlikle taşıyıcıdır (Aa).",
    ],
    commonMistakes: [
      "X'e bağlı çekinik kalıtımda hasta annenin (XᵃXᵃ) erkek çocuğunun sağlıklı olabileceğini düşünmek (erkek çocuk X'i anneden aldığı için kesin hastadır).",
    ],
    strategyTip:
      "Soyağacında X'e bağlı çekinik kontrol ederken daima 'Taralı anne → Tüm erkek çocukları taralı olmalı' ve 'Taralı kız → Babası kesin taralı olmalı' testini yap.",
    questions: [
      {
        question: "Bir besin piramidinin tabanından en üst basamağına çıkıldıkça aşağıdakilerden hangisi ARTAR?",
        options: ["Aktarılan enerji miktarı", "Birey sayısı", "Biyokütle", "Biyolojik birikim (zehirli madde)"],
        correctIndex: 3,
        explanation: "Üreticiden son tüketiciye çıkıldıkça dokularda biriken zehirli madde (biyolojik birikim) oranı artar.",
      },
    ],
  },

  // ─── YKS: AYT EDEBİYAT ────────────────────────────────────────────────────
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-edebiyat",
    subjectName: "AYT Edebiyat",
    topicSlug: "siir-bilgisi-ve-sanatlar",
    title: "Şiir Bilgisi, Nazım Biçimleri ve Edebi Sanatlar",
    shortDesc:
      "Ölçü (hece-aruz), kafiye-redif, teşbih, istiare, kinaye, tevriye, hüsn-i talil ve tecahül-i arif.",
    avgQuestions: "3 - 4 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Redif yazılışı ve görevi aynı olan ek/kelimelerdir; kafiye ise köklerdeki ses benzerliğidir.",
      "Açık istiarede yalnızca kendisine benzetilen söylenir; kapalı istiarede ise yalnızca benzeyen söylenir (kendisine benzetilen söylenmez).",
      "Hüsn-i talil bir olayı gerçek nedeninin dışında güzel bir hayali nedene bağlamaktır.",
    ],
    commonMistakes: [
      "Redif ile kafiyeyi ayırırken kelimelerin eklerini kökünden ayırmadan ses benzerliği aramak.",
    ],
    strategyTip:
      "Şiirde önce ekleri ayırıp Redif'i bul, geriye kalan kökün son harflerinde Yarım (1 ses), Tam (2 ses) veya Zengin (3+ ses) kafiyeye bak.",
    questions: [
      {
        question: "Bir gerçeği bildiği halde bilmezden gelme sanatına ne ad verilir?",
        options: ["Tevriye", "Tecahül-i Arif", "Kinaye", "Tariz"],
        correctIndex: 1,
        explanation: "Şairin bildiği bir durumu bilmiyormuş gibi aktarması Tecahül-i Arif sanatıdır.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-edebiyat",
    subjectName: "AYT Edebiyat",
    topicSlug: "islamiyet-oncesi-ve-gecis",
    title: "İslamiyet Öncesi, Geçiş Dönemi ve Halk Edebiyatı",
    shortDesc:
      "Koşuk-Sagu-Destan, Kutadgu Bilig-Divanü Lügati't-Türk, Yunus Emre, Karacaoğlan ve Aşık Edebiyatı.",
    avgQuestions: "3 Soru",
    difficulty: "Temel",
    studyMinutes: 45,
    keyPoints: [
      "İslamiyet Öncesi nazım biçimleri: Koşuk (aşk/doğa), Sagu (ağıt), Sav (atasözü), Destan.",
      "Geçiş Dönemi'nin 4 temel eseri: Kutadgu Bilig (Yusuf Has Hacib), Divanü Lügati't-Türk (Kaşgarlı Mahmud), Atabetü'l-Hakayık, Divan-ı Hikmet.",
    ],
    commonMistakes: [
      "İlk siyasetname olan Kutadgu Bilig ile ilk Türkçe sözlük olan Divanü Lügati't-Türk'ün yazarlarını karıştırmak.",
    ],
    strategyTip:
      "Halk edebiyatında tekke (Yunus Emre, Hacı Bektaş), aşık (Karacaoğlan, Dadaloğlu) ve anonim (mani, türkü) kollarını ayırt et.",
    questions: [
      {
        question: "Türk dilinin bilinen ilk sözlüğü ve dil bilgisi kitabı olan 'Divanü Lügati't-Türk' kimin eseridir?",
        options: ["Yusuf Has Hacib", "Kaşgarlı Mahmud", "Edip Ahmed Yükneki", "Ahmet Yesevi"],
        correctIndex: 1,
        explanation: "Divanü Lügati't-Türk, XI. yüzyılda Kaşgarlı Mahmud tarafından yazılmıştır.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-edebiyat",
    subjectName: "AYT Edebiyat",
    topicSlug: "divan-edebiyati",
    title: "Divan Edebiyatı Nazım Biçimleri ve Şairleri",
    shortDesc:
      "Gazel, kaside, mesnevi, rubai, tuyuğ; Fuzuli, Baki, Nedim, Nabi ve Şeyh Galip.",
    avgQuestions: "4 Soru",
    difficulty: "İleri",
    studyMinutes: 55,
    keyPoints: [
      "Gazel (aa ba ca...) genellikle aşk, şarap ve tabiat konularını işler; 5-15 beyittir.",
      "Kaside din veya devlet büyüklerini övmek için yazılır (33-99 beyit).",
      "Mesnevi her beyti kendi içinde kafiyeli (aa bb cc...) olduğu için uzun hikayelerin yazımında kullanılır.",
    ],
    commonMistakes: [
      "Türklerin Divan edebiyatına kazandırdığı iki nazım biçimi olan Tuyuğ ve Şarkı'yı Arap/İran kökenli sanmak.",
    ],
    strategyTip:
      "Mahlas (şairin adı) geçen beyit gazel veya kasidenin daima SON beytidir (makta beyti).",
    questions: [
      {
        question: "Divan edebiyatında 'aşk ve ıstırap şairi' olarak bilinen, 'Su Kasidesi' ve 'Leyla vü Mecnun'un yazarı kimdir?",
        options: ["Baki", "Nedim", "Fuzuli", "Nefi"],
        correctIndex: 2,
        explanation: "Su Kasidesi ve Leyla vü Mecnun mesnevisi Fuzuli'nin en tanınmış eserlerindendir.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "ayt-edebiyat",
    subjectName: "AYT Edebiyat",
    topicSlug: "tanzimattan-cumhuriyete",
    title: "Tanzimat, Servet-i Fünun, Millî Edebiyat ve Cumhuriyet",
    shortDesc:
      "Batılı anlamda ilk roman/tiyatro, Namık Kemal, Tevfik Fikret, Ömer Seyfettin, Beş Hececiler ve Cumhuriyet dönemi.",
    avgQuestions: "6 - 8 Soru",
    difficulty: "İleri",
    studyMinutes: 65,
    keyPoints: [
      "Tanzimat I. Dönem: Toplum için sanat (Şinasi, Namık Kemal, Ziya Paşa). II. Dönem: Sanat için sanat (Recaizade, Abdülhak Hamit).",
      "Servet-i Fünun: Ağır dil, bireysel konular; Halit Ziya Uşaklıgil (Mai ve Siyah, Aşk-ı Memnu) modern romanı kurdu.",
      "Millî Edebiyat: Genç Kalemler dergisinde 'Yeni Lisan' makalesiyle sade Türkçe hareketi başladı (Ömer Seyfettin, Ziya Gökalp).",
    ],
    commonMistakes: [
      "İlk yerli roman (Taaşşuk-ı Talat ve Fitnat) ile ilk edebi roman (İntibah) arasındaki ayrımı karıştırmak.",
    ],
    strategyTip:
      "İlkler tablosunu çıkar: İlk tiyatro Şair Evlenmesi, ilk tarihi roman Cezmi, ilk realist roman Araba Sevdası, ilk köy romanı Karabibik.",
    questions: [
      {
        question: "Türk edebiyatında ilk realist roman kabul edilen 'Araba Sevdası'nın yazarı kimdir?",
        options: ["Namık Kemal", "Recaizade Mahmut Ekrem", "Samipaşazade Sezai", "Nabizade Nazım"],
        correctIndex: 1,
        explanation: "Araba Sevdası, Recaizade Mahmut Ekrem tarafından yazılmıştır ve ilk realist roman kabul edilir.",
      },
    ],
  },

  // ─── YKS: TYT TARİH & COĞRAFYA ────────────────────────────────────────────
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-tarih",
    subjectName: "TYT Tarih",
    topicSlug: "ilk-ve-orta-cagda-turkler",
    title: "Tarih Bilimi, İlk ve Orta Çağlarda Türk Dünyası",
    shortDesc:
      "Tarihin kaynakları, Hun-Göktürk-Uygur devletleri, Kut anlayışı, kurultay ve töre.",
    avgQuestions: "2 Soru",
    difficulty: "Temel",
    studyMinutes: 35,
    keyPoints: [
      "Tarihi olaylar mutlaka döneminin şartlarına göre değerlendirilmelidir (anakronizmden kaçınma).",
      "Asya Hun Devleti'nde Mete Han orduyu onluk sisteme göre düzenledi.",
      "Uygurlar yerleşik hayata geçerek tarım, matbaa ve mimari eserler bırakan ilk Türk devleti oldu.",
    ],
    commonMistakes: [
      "Orhun Kitabeleri'nin Uygurlara ait olduğunu sanmak (II. Göktürk Devleti dönemine aittir).",
    ],
    strategyTip:
      "TYT Tarih soruları ağırlıklı olarak yorum + temel bilgi içerir; paragrafta verilen 'yerleşik hayat, ikili teşkilat, kut' kavramlarını iyi analiz et.",
    questions: [
      {
        question: "Yerleşik hayata geçerek tapınaklar ve matbaa kullanan ilk Türk devleti hangisidir?",
        options: ["Asya Hun Devleti", "I. Göktürk Devleti", "Uygurlar", "Kırgızlar"],
        correctIndex: 2,
        explanation: "Maniheizm dinini kabul eden Uygurlar yerleşik hayata geçen ilk Türk devletidir.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-tarih",
    subjectName: "TYT Tarih",
    topicSlug: "osmanli-kurulus-ve-inkilap",
    title: "Osmanlı Kültür-Medeniyeti ve Millî Mücadele Özeti",
    shortDesc:
      "Divan-ı Hümayun, Tımar sistemi, Islahat-Tanzimat Fermanları ve Kurtuluş Savaşı dönüm noktaları.",
    avgQuestions: "3 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Tımar sistemi ile devlet hazineden para çıkarmadan hem tarımda süreklilik sağlamış hem de Cebelu (asker) yetiştirmiştir.",
      "Tanzimat Fermanı ile ilk kez kanun üstünlüğü ilkesi benimsenmiştir.",
    ],
    commonMistakes: [
      "Divan-ı Hümayun'un yasama meclisi olduğunu sanmak (padişaha danışma ve yüksek mahkeme niteliğindedir; son söz padişahındır).",
    ],
    strategyTip:
      "Tımar sisteminin ekonomik, askeri ve idari faydalarını tek şemada tut: Üretim + Asker + Güvenlik.",
    questions: [
      {
        question: "Osmanlı Devleti'nde dirlik sahiplerinin vergi gelirleri karşılığında yetiştirdiği atlı askerlere ne ad verilirdi?",
        options: ["Yeniçeri", "Cebelü", "Akıncı", "Lağımcı"],
        correctIndex: 1,
        explanation: "Tımar sahiplerinin beslediği atlı askerlere Cebelü denir.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-cografya",
    subjectName: "TYT Coğrafya",
    topicSlug: "cografi-konum-ve-iklim",
    title: "Coğrafi Konum, Harita Bilgisi ve İklim Elemanları",
    shortDesc:
      "Türkiye'nin mutlak-göreceli konumu (36°-42° K, 26°-45° D), izohipsler, basınç ve Türkiye'de iklim tipleri.",
    avgQuestions: "3 Soru",
    difficulty: "Orta",
    studyMinutes: 45,
    keyPoints: [
      "Türkiye 36°-42° Kuzey paralelleri (Orta Kuşak) ile 26°-45° Doğu meridyenleri arasındadır (en doğu ile en batı arası 76 dakika).",
      "İzohips haritalarında çizgilerin sıklaştığı yerlerde eğim fazladır; deniz kıyısı 0 m eğrisidir.",
    ],
    commonMistakes: [
      "Türkiye'de dağların güney yamaçlarının daha sıcak olmasını göreceli konum sanmak (Kuzey Yarım Küre'de olduğumuz için Mutlak/Matematik konumdur).",
    ],
    strategyTip:
      "Kuzey Yarım Küre + Orta Kuşak sonuçları = Mutlak Konum; Dağların uzanışı, yükselti, denizellik = Göreceli (Özel) Konum.",
    questions: [
      {
        question: "Türkiye'de dört mevsimin belirgin olarak yaşanması aşağıdakilerden hangisinin sonucudur?",
        options: [
          "Üç tarafının denizlerle çevrili olmasının",
          "Orta Kuşak'ta yer almasının (Mutlak Konum)",
          "Ortalama yükseltisinin fazla olmasının",
          "Dağların doğu-batı yönlü uzanmasının",
        ],
        correctIndex: 1,
        explanation: "Dört mevsimin belirgin yaşanması Orta Kuşak (36°-42° K) yani Mutlak Konum sonucudur.",
      },
    ],
  },
  {
    exam: "yks",
    examLabel: "YKS (TYT - AYT)",
    subjectSlug: "tyt-cografya",
    subjectName: "TYT Coğrafya",
    topicSlug: "ic-ve-dis-kuvvetler",
    title: "İç-Dış Kuvvetler, Nüfus ve Doğal Afetler",
    shortDesc:
      "Orojenez, epirojenez, akarsu-rüzgar-karstik şekiller, nüfus piramitleri ve Türkiye'de doğal afet dağılışı.",
    avgQuestions: "2 Soru",
    difficulty: "Temel",
    studyMinutes: 40,
    keyPoints: [
      "Karstik şekiller (lapya, dolin, obruk, traverten) Türkiye'de en yoğun Akdeniz Bölgesi'nde (kireçtaşı) görülür.",
      "Heyelan en fazla Karadeniz Bölgesi'nde (eğim + killi toprak + bol yağış) ve ilkbahar mevsiminde yaşanır.",
    ],
    commonMistakes: [
      "Erozyon ile heyelanı karıştırmak (erozyon toprağın üst kısmının süpürülmesidir, ağaçlandırmayla önlenir; heyelan kütle hareketidir).",
    ],
    strategyTip:
      "Delta ovası oluşumu için akarsuyun bol alüvyon taşıması, kıyının sığ olması ve gelgit/akıntının az olması gerekir.",
    questions: [
      {
        question: "Türkiye'de heyelan olaylarının en sık görüldüğü bölge ve mevsim eşleştirmesi hangisidir?",
        options: [
          "İç Anadolu - Yaz",
          "Karadeniz - İlkbahar",
          "Ege - Kış",
          "Güneydoğu Anadolu - Sonbahar",
        ],
        correctIndex: 1,
        explanation: "Kar erimeleriyle toprağın suya doyduğu İlkbahar'da ve eğimli Karadeniz Bölgesi'nde heyelan en sıktır.",
      },
    ],
  },
];

export function getAllTopics(): CurriculumTopic[] {
  return CURRICULUM_TOPICS;
}

export function getTopicsByExam(exam: ExamKey): CurriculumTopic[] {
  return CURRICULUM_TOPICS.filter((t) => t.exam === exam);
}

export function getTopicByParams(
  exam: string,
  subject: string,
  topic: string,
): CurriculumTopic | null {
  return (
    CURRICULUM_TOPICS.find(
      (t) =>
        t.exam === exam &&
        t.subjectSlug === subject &&
        t.topicSlug === topic,
    ) ?? null
  );
}

export function getSubjectTopics(exam: ExamKey, subjectSlug: string): CurriculumTopic[] {
  return CURRICULUM_TOPICS.filter(
    (t) => t.exam === exam && t.subjectSlug === subjectSlug,
  );
}

export function getGroupedSubjects(exam: ExamKey) {
  const topics = getTopicsByExam(exam);
  const map = new Map<string, { subjectSlug: string; subjectName: string; topics: CurriculumTopic[] }>();
  for (const t of topics) {
    const existing = map.get(t.subjectSlug);
    if (existing) {
      existing.topics.push(t);
    } else {
      map.set(t.subjectSlug, {
        subjectSlug: t.subjectSlug,
        subjectName: t.subjectName,
        topics: [t],
      });
    }
  }
  return Array.from(map.values());
}
