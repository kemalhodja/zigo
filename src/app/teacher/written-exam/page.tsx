"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Download,
  Edit3,
  FileText,
  HelpCircle,
  Loader2,
  Printer,
  RotateCcw,
  Save,
  School,
  Sparkles,
  X,
} from "lucide-react";

interface RubricStep {
  step: string;
  points: number;
}

interface ExamQuestion {
  number: number;
  kazanim: string;
  text: string;
  points: number;
  solution: string;
  rubric: RubricStep[];
}

interface ExamData {
  schoolName: string;
  academicYear: string;
  grade: string;
  subject: string;
  term: string;
  scenario: string;
  durationMinutes: number;
  questions: ExamQuestion[];
}

const STORAGE_KEY = "zigo_teacher_written_exam_v1";

const DEFAULT_EXAM: ExamData = {
  schoolName: "MEB Zigo Örnek Ortaokulu / Anadolu Lisesi",
  academicYear: "2025-2026 Eğitim Öğretim Yılı",
  grade: "8. Sınıf",
  subject: "Matematik",
  term: "1. Dönem 2. Yazılı (MEB Ortak Sınavı)",
  scenario: "Senaryo 1 (MEB Konu Soru Dağılım Tablosu)",
  durationMinutes: 40,
  questions: [
    {
      number: 1,
      kazanim: "M.8.1.1.2. İki doğal sayının en büyük ortak bölenini (EBOB) ve en küçük ortak katını (EKOK) hesaplar.",
      text: "Ayrıt uzunlukları 48 metre ve 60 metre olan dikdörtgen biçimindeki bir tarlanın etrafına, köşelere de gelmek şartıyla eşit aralıklarla fidan dikilecektir. İki fidan arasındaki mesafe en fazla kaç metre olabilir ve toplam kaç fidan gerekir? İşlem basamaklarınızı göstererek bulunuz.",
      points: 15,
      solution: "1. Adım: İki fidan arası mesafenin en fazla olması için EBOB(48, 60) hesaplanır.\n48 = 2⁴ · 3, 60 = 2² · 3 · 5\nEBOB(48, 60) = 2² · 3 = 12 metredir.\n\n2. Adım: Tarlanın çevresi hesaplanır.\nÇevre = 2 · (48 + 60) = 2 · 108 = 216 metre.\n\n3. Adım: Fidan sayısı = Çevre / EBOB = 216 / 12 = 18 fidan gereklidir.",
      rubric: [
        { step: "EBOB(48, 60) = 12 m olduğunu doğru hesaplama", points: 8 },
        { step: "Tarlanın çevresini bulup fidan sayısını (18) doğru hesaplama", points: 7 },
      ],
    },
    {
      number: 2,
      kazanim: "M.8.1.2.1. Tam sayıların tam sayı kuvvetlerini hesaplar.",
      text: "2⁻³ + 4⁻¹ işleminin sonucunu rasyonel sayı biçiminde yazarak en sade halini işlem adımlarıyla bulunuz.",
      points: 15,
      solution: "1. Adım: Negatif üs kuralı uygulanır:\n2⁻³ = 1 / 2³ = 1 / 8\n4⁻¹ = 1 / 4¹ = 1 / 4\n\n2. Adım: Paydalar eşitlenir (4, 2 ile genişletilir):\n1 / 8 + 2 / 8 = 3 / 8 olarak bulunur.",
      rubric: [
        { step: "Negatif üsleri rasyonel ifadeye doğru çevirme (1/8 ve 1/4)", points: 8 },
        { step: "Payda eşitleyip 3/8 sonucuna ulaşma", points: 7 },
      ],
    },
    {
      number: 3,
      kazanim: "M.8.1.2.5. Sayıların ondalık gösterimlerini 10'un tam sayı kuvvetlerini kullanarak çözümler.",
      text: "305,048 ondalık gösterimini 10'un tam sayı kuvvetlerini kullanarak çözümleyiniz.",
      points: 15,
      solution: "305,048 = (3 · 10²) + (0 · 10¹) + (5 · 10⁰) + (0 · 10⁻¹) + (4 · 10⁻²) + (8 · 10⁻³)\n= (3 · 10²) + (5 · 10⁰) + (4 · 10⁻²) + (8 · 10⁻³)",
      rubric: [
        { step: "Tam kısım çözümlemesini doğru yazma (3·10² + 5·10⁰)", points: 8 },
        { step: "Kesir kısmı çözümlemesini doğru yazma (4·10⁻² + 8·10⁻³)", points: 7 },
      ],
    },
    {
      number: 4,
      kazanim: "M.8.1.3.1. Tam kare pozitif tam sayıların kareköklerini belirler.",
      text: "Alanı 289 cm² olan kare şeklindeki bir kartonun çevresi kaç santimetredir? Çözüm basamaklarını gösteriniz.",
      points: 15,
      solution: "1. Adım: Bir kenar uzunluğu a olsun. Alan = a² = 289 ise a = √289 = 17 cm.\n2. Adım: Karenin çevresi = 4 · a = 4 · 17 = 68 cm olarak bulunur.",
      rubric: [
        { step: "Karekök alarak bir kenarı 17 cm bulma", points: 8 },
        { step: "Çevre formülünü uygulayıp 68 cm bulma", points: 7 },
      ],
    },
    {
      number: 5,
      kazanim: "M.8.1.3.2. Tam kare olmayan kareköklü bir sayının hangi iki doğal sayı arasında olduğunu belirler.",
      text: "√115 sayısının hangi iki ardışık doğal sayı arasında olduğunu bulunuz ve bu sayılardan hangisine daha yakın olduğunu işlem adımlarıyla açıklayınız.",
      points: 20,
      solution: "1. Adım: 115'ten küçük en büyük tam kare 100 (10²), büyük en küçük tam kare 121 (11²)'dir.\n√100 < √115 < √121 olduğundan 10 ile 11 arasındadır.\n\n2. Adım: Farklar incelenir:\n115 - 100 = 15\n121 - 115 = 6\n115 sayısı 121'e daha yakın olduğundan √115 sayısı 11 doğal sayısına daha yakındır.",
      rubric: [
        { step: "10 ile 11 arasında olduğunu doğru tespit etme", points: 10 },
        { step: "Farkları kıyaslayıp 11'e daha yakın olduğunu gerekçesiyle açıklama", points: 10 },
      ],
    },
    {
      number: 6,
      kazanim: "M.8.1.3.3. Kareköklü bir ifadeyi a√b şeklinde yazar ve a√b şeklindeki ifadede katsayıyı kök içine alır.",
      text: "√180 ifadesini a√b biçiminde en sade katsayı ile yazınız.",
      points: 20,
      solution: "180 sayısı asal çarpanlarına ayrılır veya tam kare çarpanı bulunur:\n180 = 36 · 5 = 6² · 5\n√180 = √(36 · 5) = 6√5 olarak bulunur.",
      rubric: [
        { step: "180'in 36 · 5 çarpanını belirleme veya asal çarpanlara ayırma", points: 10 },
        { step: "Kök dışına 6√5 olarak doğru çıkarma", points: 10 },
      ],
    },
  ],
};

const PRESET_TEMPLATES: { id: string; label: string; icon: string; data: ExamData }[] = [
  {
    id: "math-8-s1",
    label: "8. Sınıf Matematik (Senaryo 1)",
    icon: "📐",
    data: DEFAULT_EXAM,
  },
  {
    id: "science-8-s1",
    label: "8. Sınıf Fen Bilimleri (Senaryo 1)",
    icon: "🧬",
    data: {
      schoolName: "MEB Zigo Örnek Ortaokulu / Anadolu Lisesi",
      academicYear: "2025-2026 Eğitim Öğretim Yılı",
      grade: "8. Sınıf",
      subject: "Fen Bilimleri",
      term: "1. Dönem 1. Yazılı (MEB Ortak Sınavı)",
      scenario: "Senaryo 1 (MEB Konu Soru Dağılım Tablosu)",
      durationMinutes: 40,
      questions: [
        {
          number: 1,
          kazanim: "F.8.1.1.1. Mevsimlerin oluşumuna yönelik tahminlerde bulunur.",
          text: "Dünya'nın eksen eğikliği ve Güneş etrafındaki dolanma hareketinin mevsimlerin oluşumuna etkisini açıklayınız.",
          points: 20,
          solution: "Dünya'nın dönme ekseninin 23° 27' eğik olması ve Güneş etrafında dolanması nedeniyle Güneş ışınlarının birim yüzeye düşme açısı yıl boyunca değişir. Dik ve dike yakın gelen ışınlar daha fazla ısı enerjisi aktararak yaz mevsimini, eğik gelen ışınlar ise daha az ısı enerjisi aktararak kış mevsimini oluşturur.",
          rubric: [
            { step: "Eksen eğikliği ve dolanma hareketini belirtme", points: 10 },
            { step: "Işınların geliş açısı ile birim yüzeye düşen enerji ilişkisini doğru açıklama", points: 10 },
          ],
        },
        {
          number: 2,
          kazanim: "F.8.1.2.1. İklim ve hava olayları arasındaki farkı açıklar.",
          text: "İklim ve hava olayları arasındaki üç temel farkı maddeler halinde yazınız.",
          points: 20,
          solution: "1. İklim geniş bölgelerde uzun yıllar (30-40 yıl) süren ortalama hava durumudur; hava olayları dar bir alanda kısa sürede değişir.\n2. İklim kesindir ve kolay değişmez; hava olayları tahminidir ve değişkenlik gösterir.\n3. İklimi klimatoloji incelerken; hava olaylarını meteoroloji inceler.",
          rubric: [
            { step: "Zaman ve alan farkını doğru yazma", points: 8 },
            { step: "Kesinlik / tahmin farkını belirtme", points: 6 },
            { step: "Bilim dallarını (klimatoloji - meteoroloji) doğru eşleştirme", points: 6 },
          ],
        },
        {
          number: 3,
          kazanim: "F.8.2.1.1. DNA'nın yapısını model üzerinde gösterir.",
          text: "Bir DNA molekülünde 600 Guanin ve 400 Adenin nükleotidi bulunmaktadır. Bu DNA molekülündeki toplam deoksiriboz şekeri ve fosfat sayısını işlem basamaklarıyla hesaplayınız.",
          points: 30,
          solution: "1. Adım: DNA çift zincirli olduğundan:\nGuanin (G) = Sitozin (C) = 600\nAdenin (A) = Timin (T) = 400\nToplam Nükleotid = G + C + A + T = 600 + 600 + 400 + 400 = 2000 nükleotid.\n\n2. Adım: Her nükleotidde 1 adet şeker ve 1 adet fosfat bulunur.\nToplam Deoksiriboz Şekeri = 2000 adet\nToplam Fosfat = 2000 adet olarak bulunur.",
          rubric: [
            { step: "Eşleşme kuralını uygulayıp (G=C, A=T) toplam nükleotidi (2000) bulma", points: 15 },
            { step: "Nükleotid = Şeker = Fosfat kuralını uygulayarak 2000 sonucunu yazma", points: 15 },
          ],
        },
        {
          number: 4,
          kazanim: "F.8.2.2.1. Genetik mühendisliği ve biyoteknolojiyi açıklar.",
          text: "Biyoteknolojik uygulamaların insanlık için birer olumlu ve olumsuz yönünü örnek vererek açıklayınız.",
          points: 30,
          solution: "Olumlu Yönü: İnsülin hormonu ve aşıların bakteriler vasıtasıyla ucuza ve hızlı üretilerek hastalıkların tedavi edilmesi.\nOlumsuz Yönü: GDO'lu ürünlerin biyoçeşitliliği azaltması, alerjik reaksiyonlara veya antibiyotik direncine yol açma riski.",
          rubric: [
            { step: "Olumlu yönü mantıklı bir tıp/tarım örneğiyle açıklama", points: 15 },
            { step: "Olumsuz yönü biyoçeşitlilik/sağlık riskiyle açıklama", points: 15 },
          ],
        },
      ],
    },
  },
  {
    id: "turkish-8-s2",
    label: "8. Sınıf Türkçe (Senaryo 2)",
    icon: "🇹🇷",
    data: {
      schoolName: "MEB Zigo Örnek Ortaokulu / Anadolu Lisesi",
      academicYear: "2025-2026 Eğitim Öğretim Yılı",
      grade: "8. Sınıf",
      subject: "Türkçe",
      term: "1. Dönem 1. Yazılı (MEB Ortak Sınavı)",
      scenario: "Senaryo 2 (MEB Konu Soru Dağılım Tablosu)",
      durationMinutes: 40,
      questions: [
        {
          number: 1,
          kazanim: "T.8.3.9. Fiilimsilerin cümledeki işlevlerini fark eder.",
          text: "\"Güneş doğarken yola çıkan yolcular, dinlenmek için göl kenarında durdular.\" cümlesindeki fiilimsileri bularak türlerini (isim-fiil, sıfat-fiil, zarf-fiil) belirtiniz.",
          points: 25,
          solution: "1. \"doğarken\" -> Zarf-fiil (-ken eki)\n2. \"çıkan\" -> Sıfat-fiil (-an eki)\n3. \"dinlenmek\" -> İsim-fiil (-mek eki)",
          rubric: [
            { step: "\"doğarken\" sözcüğünü zarf-fiil olarak belirleme", points: 8 },
            { step: "\"çıkan\" sözcüğünü sıfat-fiil olarak belirleme", points: 8 },
            { step: "\"dinlenmek\" sözcüğünü isim-fiil olarak belirleme", points: 9 },
          ],
        },
        {
          number: 2,
          kazanim: "T.8.3.14. Metindeki söz sanatlarını tespit eder.",
          text: "\"Gök yüzü ağlıyordu dün gece, rüzgâr ise acı bir çığlıkla sokakları dolaşıyordu.\" cümlesindeki söz sanatlarını bularak hangi sözcüklerle yapıldığını açıklayınız.",
          points: 25,
          solution: "Cümlede Teşhis (Kişileştirme) sanatı vardır. Gökyüzünün ağlaması ve rüzgârın çığlık atarak sokakları dolaşması, insana ait özelliklerin doğadaki varlıklara aktarılmasıyla kişileştirilmiştir.",
          rubric: [
            { step: "Teşhis / Kişileştirme sanatını doğru adlandırma", points: 12 },
            { step: "Hangi varlıklara insani özellik verildiğini eksiksiz açıklama", points: 13 },
          ],
        },
        {
          number: 3,
          kazanim: "T.8.4.16. Yazdıklarını dil ve anlatım yönünden inceler.",
          text: "Kitap okumanın insanın hayal gücüne ve düşünce dünyasına katkılarını anlatan en az 4 cümlelik düşünce paragrafı yazınız.",
          points: 50,
          solution: "Öğrencinin; kitapların zihin ufkunu genişlettiğini, empati yeteneğini geliştirdiğini ve kelime dağarcığını zenginleştirdiğini vurgulayan, imla ve noktalama kurallarına uygun paragrafı.",
          rubric: [
            { step: "Konuya uygunluk ve düşünce bütünlüğü sağlama", points: 25 },
            { step: "İmla, noktalama ve akıcı anlatım kurallarına uyma", points: 25 },
          ],
        },
      ],
    },
  },
];

export default function WrittenExamPage() {
  const router = useRouter();

  // Primary Data State
  const [exam, setExam] = useState<ExamData>(DEFAULT_EXAM);
  const [viewMode, setViewMode] = useState<"student" | "rubric">("student");

  // Form Inputs for Generator
  const [schoolName, setSchoolName] = useState(DEFAULT_EXAM.schoolName);
  const [grade, setGrade] = useState(DEFAULT_EXAM.grade);
  const [subject, setSubject] = useState(DEFAULT_EXAM.subject);
  const [term, setTerm] = useState(DEFAULT_EXAM.term);
  const [scenario, setScenario] = useState(DEFAULT_EXAM.scenario);
  const [topics, setTopics] = useState("Çarpanlar ve Katlar, Üslü İfadeler, Kareköklü İfadeler");
  const [questionCount, setQuestionCount] = useState(6);
  const [durationMinutes, setDurationMinutes] = useState(40);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setExam(JSON.parse(saved));
      }
    } catch {}
  }, []);

  function triggerHaptic(type: "click" | "success" | "warn" = "click") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "click") navigator.vibrate(8);
      else if (type === "success") navigator.vibrate([15, 30, 20]);
      else if (type === "warn") navigator.vibrate([30, 30, 30]);
    }
  }

  function saveToLocal(data: ExamData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  async function handleGenerateExam(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsGenerating(true);
    triggerHaptic("click");

    try {
      const res = await fetch("/api/teacher/written-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: schoolName.trim(),
          academicYear: "2025-2026 Eğitim Öğretim Yılı",
          grade,
          subject,
          term,
          scenario,
          topics: topics.trim(),
          questionCount,
          durationMinutes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sınav oluşturulamadı.");

      setExam(data);
      saveToLocal(data);
      setShowConfigPanel(false);
      triggerHaptic("success");
    } catch (err: any) {
      alert(err.message || "Bir hata oluştu.");
      triggerHaptic("warn");
    } finally {
      setIsGenerating(false);
    }
  }

  function handlePrint() {
    triggerHaptic("click");
    window.print();
  }

  function handleCopyForWord() {
    triggerHaptic("success");
    let text = `T.C.\nMİLLÎ EĞİTİM BAKANLIĞI\n${exam.schoolName.toUpperCase()}\n${exam.academicYear.toUpperCase()}\n${exam.grade.toUpperCase()} ${exam.subject.toUpperCase()} DERSİ ${exam.term.toUpperCase()}\n(${exam.scenario})\n\n`;
    text += `Adı Soyadı: .................................................... Sınıfı/Şubesi: .......... Okul No: .......... Aldığı Puan: [       / 100]\n\n`;
    text += `--------------------------------------------------------------------------------\n\n`;

    exam.questions.forEach((q) => {
      text += `SORU ${q.number} (${q.points} Puan) - [${q.kazanim}]\n`;
      text += `${q.text}\n\n`;
      text += `Çözüm Alanı:\n\n\n\n\n\n\n`;
    });

    if (viewMode === "rubric") {
      text += `\n================================================================================\n`;
      text += `CEVAP ANAHTARI VE PUANLAMA BAREMİ (ÖĞRETMEN NÜSHASI)\n`;
      text += `================================================================================\n\n`;
      exam.questions.forEach((q) => {
        text += `SORU ${q.number} CEVABI VE BAREMİ:\n`;
        text += `Model Çözüm:\n${q.solution}\n`;
        text += `Puanlama Kriterleri:\n`;
        q.rubric.forEach((r, ri) => {
          text += `  - ${r.step} (${r.points} Puan)\n`;
        });
        text += `\n`;
      });
    }

    void navigator.clipboard?.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  }

  const totalPoints = exam.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-28 print:bg-white print:p-0 print:pb-0">
      {/* Top Navbar (Hidden on Print) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/teacher")}
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900">MEB Açık Uçlu Yazılı Sınav Hazırlayıcı</h1>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-black text-emerald-700 border border-emerald-200">
                  Yeni MEB Formatı
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400">
                {exam.grade} {exam.subject} · {exam.questions.length} Açık Uçlu Soru · {totalPoints} Puan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setViewMode("student");
                  triggerHaptic("click");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                  viewMode === "student"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="size-3.5" />
                <span className="hidden sm:inline">Sınav Kağıdı</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("rubric");
                  triggerHaptic("click");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                  viewMode === "rubric"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Check className="size-3.5" />
                <span className="hidden sm:inline">Puanlama Baremi (Rubrik)</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="tap-scale flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-indigo-700 shadow-sm transition"
              title="Resmi A4 Olarak Yazdır veya PDF İndir"
            >
              <Printer className="size-3.5" />
              <span className="hidden md:inline">Yazdır / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-5xl p-4 sm:p-6 space-y-5 print:p-0 print:max-w-none">
        {/* Generator Controls Bar (Hidden on Print) */}
        <div className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm print:hidden space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                  MEB Konu Soru Dağılım Motoru
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Müfredat konularını girin; açık uçlu soruları, kazanımları ve puanlama baremini yapay zekâ hazırlasın.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyForWord}
                className="tap-scale flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <Copy className="size-3.5 text-slate-500" />
                <span>{copiedText ? "Word İçin Kopyalandı!" : "Word Metnini Al"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfigPanel((v) => !v)}
                className="tap-scale flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:brightness-105 transition"
              >
                <Edit3 className="size-3.5" />
                <span>Sınav Parametrelerini Değiştir</span>
                <ChevronDown className={`size-3 transition-transform ${showConfigPanel ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Quick MEB Scenario Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">
              ⚡ 1-Tıkla MEB Şablonu:
            </span>
            {PRESET_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  setExam(tmpl.data);
                  saveToLocal(tmpl.data);
                  triggerHaptic("success");
                }}
                className="tap-scale flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-100 transition shadow-2xs"
              >
                <span>{tmpl.icon}</span>
                <span>{tmpl.label}</span>
              </button>
            ))}
          </div>

          {/* Collapsible Configuration Form */}
          {showConfigPanel && (
            <form onSubmit={handleGenerateExam} className="mt-4 border-t border-slate-100 pt-4 space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-500">Okul Adı</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-500">Sınıf</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="5. Sınıf">5. Sınıf</option>
                    <option value="6. Sınıf">6. Sınıf</option>
                    <option value="7. Sınıf">7. Sınıf</option>
                    <option value="8. Sınıf">8. Sınıf (LGS)</option>
                    <option value="9. Sınıf">9. Sınıf (Lise)</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="12. Sınıf">12. Sınıf</option>
                  </select>
                </div>

                <div>
                  <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-500">Ders</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="Matematik">Matematik</option>
                    <option value="Fen Bilimleri">Fen Bilimleri</option>
                    <option value="Türkçe">Türkçe</option>
                    <option value="T.C. İnkılap Tarihi">T.C. İnkılap Tarihi</option>
                    <option value="İngilizce">İngilizce</option>
                    <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                    <option value="Fizik">Fizik</option>
                    <option value="Kimya">Kimya</option>
                    <option value="Biyoloji">Biyoloji</option>
                    <option value="Tarih">Tarih</option>
                    <option value="Coğrafya">Coğrafya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-500">Dönem / Yazılı</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="1. Dönem 1. Yazılı">1. Dönem 1. Yazılı</option>
                    <option value="1. Dönem 2. Yazılı (MEB Ortak Sınavı)">1. Dönem 2. Yazılı (Ortak)</option>
                    <option value="2. Dönem 1. Yazılı">2. Dönem 1. Yazılı</option>
                    <option value="2. Dönem 2. Yazılı (MEB Ortak Sınavı)">2. Dönem 2. Yazılı (Ortak)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-500">MEB Senaryosu</label>
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="Senaryo 1 (MEB Konu Soru Dağılım Tablosu)">Senaryo 1 (Temel Düzey)</option>
                    <option value="Senaryo 2 (MEB Konu Soru Dağılım Tablosu)">Senaryo 2 (Karma & Yeni Nesil)</option>
                    <option value="Senaryo 3 (MEB Konu Soru Dağılım Tablosu)">Senaryo 3 (Kapsamlı)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-500">Soru Sayısı</label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    >
                      <option value={5}>5 Soru (Her biri 20 P)</option>
                      <option value={6}>6 Soru</option>
                      <option value={7}>7 Soru</option>
                      <option value={8}>8 Soru</option>
                      <option value={10}>10 Soru (Her biri 10 P)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-500">Süre (Dk)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      min={20}
                      max={80}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-500">
                  Dahil Edilecek Kazanım Konuları *
                </label>
                <input
                  type="text"
                  required
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="Örn: Çarpanlar ve Katlar, EBOB-EKOK, Üslü İfadeler, Karekök"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="tap-scale flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-black text-white hover:bg-indigo-700 shadow-sm transition"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>MEB Yazılı Sınavı Hazırlanıyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      <span>Yazılı Sınavı AI ile Yeniden Oluştur</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ============================================================== */}
        {/* A4 PAPER PREVIEW CONTAINER (Clean Print Formatting)            */}
        {/* ============================================================== */}
        <div className="mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
          {/* Official MEB Exam Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <p className="text-xs font-black tracking-widest text-slate-700">T.C.</p>
            <p className="text-xs font-black tracking-wider text-slate-800">MİLLÎ EĞİTİM BAKANLIĞI</p>
            <h2 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wide">
              {exam.schoolName}
            </h2>
            <p className="text-xs font-black text-slate-900">
              {exam.academicYear} · {exam.grade.toUpperCase()} {exam.subject.toUpperCase()} DERSİ
            </p>
            <p className="text-xs font-bold text-slate-600">
              {exam.term} · {exam.scenario}
            </p>
          </div>

          {/* Student Info & Score Box */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch justify-between gap-3 border-2 border-slate-900 p-3 text-xs font-bold">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
              <div>
                <span className="text-slate-500">Adı ve Soyadı:</span>
                <span className="ml-2 inline-block border-b border-dotted border-slate-500 w-36"></span>
              </div>
              <div>
                <span className="text-slate-500">Sınıfı / Şubesi:</span>
                <span className="ml-2 inline-block border-b border-dotted border-slate-500 w-20"></span>
              </div>
              <div>
                <span className="text-slate-500">Okul Numarası:</span>
                <span className="ml-2 inline-block border-b border-dotted border-slate-500 w-24"></span>
              </div>
              <div>
                <span className="text-slate-500">Sınav Süresi:</span>
                <span className="ml-2 text-slate-900 font-black">{exam.durationMinutes} Dakika</span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center justify-center border-t sm:border-t-0 sm:border-l-2 border-slate-900 sm:pl-4 pt-2 sm:pt-0 min-w-[100px]">
              <span className="text-[0.65rem] font-black uppercase text-slate-500">ALDIĞI PUAN</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                / {totalPoints}
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: STUDENT EXAM PAPER */}
          {viewMode === "student" ? (
            <div className="mt-8 space-y-8">
              {exam.questions.map((q, idx) => (
                <div key={idx} className="space-y-3 break-inside-avoid">
                  {/* Question Title & Points */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white print:border print:border-black print:bg-white print:text-black">
                        {q.number}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-[0.68rem] font-mono font-semibold text-slate-500 print:text-slate-700">
                          {q.kazanim}
                        </p>
                        <p className="text-sm font-black text-slate-900 leading-relaxed">
                          {q.text}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-800 print:border-black print:bg-white">
                      ({q.points} Puan)
                    </span>
                  </div>

                  {/* Lined Solution Area for Student Work */}
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/40 p-4 print:border-slate-400 print:bg-white">
                    <span className="text-[0.62rem] font-black uppercase tracking-wider text-slate-400 print:text-slate-600">
                      Çözüm ve İşlem Alanı:
                    </span>
                    <div className="mt-2 space-y-5">
                      <div className="border-b border-dotted border-slate-300 print:border-slate-400 h-1"></div>
                      <div className="border-b border-dotted border-slate-300 print:border-slate-400 h-1"></div>
                      <div className="border-b border-dotted border-slate-300 print:border-slate-400 h-1"></div>
                      <div className="border-b border-dotted border-slate-300 print:border-slate-400 h-1"></div>
                      <div className="border-b border-dotted border-slate-300 print:border-slate-400 h-1"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* VIEW MODE 2: TEACHER RUBRIC & ANSWER KEY */
            <div className="mt-8 space-y-8">
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs font-bold text-amber-900 print:border-black print:bg-white">
                📌 <strong>Öğretmen Değerlendirme Nüshası:</strong> Aşağıdaki çözüm basamakları ve puanlama baremi, MEB Ölçme ve Değerlendirme yönergesi gereği öğrencilerin kısmi doğru adımlarına puan vermek amacıyla hazırlanmıştır.
              </div>

              {exam.questions.map((q, idx) => (
                <div key={idx} className="rounded-2xl border-2 border-slate-200 p-5 space-y-4 break-inside-avoid print:border-black">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-sm font-black text-slate-900">
                      Soru {q.number} Çözüm Anahtarı & Baremi
                    </span>
                    <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-black text-indigo-700 print:border-black print:text-black">
                      Toplam: {q.points} Puan
                    </span>
                  </div>

                  {/* Soru Metni Hatırlatma */}
                  <div className="text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-mono text-[0.68rem] block mb-0.5">{q.kazanim}</span>
                    {q.text}
                  </div>

                  {/* Model Çözüm */}
                  <div>
                    <span className="text-[0.68rem] font-black uppercase tracking-wider text-emerald-700">
                      Örnek Model Çözüm:
                    </span>
                    <pre className="mt-1 whitespace-pre-wrap rounded-xl bg-emerald-50/60 p-3 font-sans text-xs font-medium text-slate-800 border border-emerald-200 print:border-black print:bg-white">
                      {q.solution}
                    </pre>
                  </div>

                  {/* Puanlama Baremi Tablosu */}
                  <div>
                    <span className="text-[0.68rem] font-black uppercase tracking-wider text-slate-700">
                      Adım Adım Puanlama Kriterleri (Rubrik):
                    </span>
                    <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 font-black text-slate-700 uppercase text-[0.65rem] border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Değerlendirilecek Çözüm Adımı / Kriter</th>
                            <th className="p-2.5 w-24 text-right">Puan Değeri</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {q.rubric.map((r, ri) => (
                            <tr key={ri} className="hover:bg-slate-50/50">
                              <td className="p-2.5 text-slate-800">{r.step}</td>
                              <td className="p-2.5 text-right font-black text-indigo-700">{r.points} Puan</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exam Footer Note */}
          <div className="mt-10 border-t border-slate-300 pt-4 text-center text-xs font-bold text-slate-500">
            <p>Sınav süresi {exam.durationMinutes} dakikadır. Başarılar dileriz.</p>
            <p className="text-[0.65rem] text-slate-400 mt-0.5">
              Zigo Eğitim Teknolojileri · Millî Eğitim Bakanlığı Açık Uçlu Ortak Sınav Formatı
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
