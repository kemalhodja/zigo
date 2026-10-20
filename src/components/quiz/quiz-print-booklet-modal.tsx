"use client";

import { useRef, useState } from "react";
import { Check, Eye, EyeOff, Printer, Sparkles, X } from "lucide-react";

export interface PrintableQuestion {
  text: string;
  options: string[];
  type?: "multiple_choice" | "true_false";
  correctIndex?: number;
  explanation?: string | null;
  imageUrl?: string | null;
}

interface QuizPrintBookletModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | null;
  targetGrade?: string | null;
  questions: PrintableQuestion[];
}

export function QuizPrintBookletModal({
  isOpen,
  onClose,
  title,
  description,
  targetGrade = "Tüm Sınıflar",
  questions,
}: QuizPrintBookletModalProps) {
  const [schoolName, setSchoolName] = useState("T.C. MİLLİ EĞİTİM BAKANLIĞI / ZİGO AKADEMİ");
  const [examDuration, setExamDuration] = useState("40");
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [showOpticalSheet, setShowOpticalSheet] = useState(true);

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  // Split questions into two columns for genuine MEB / ÖSYM test paper layout
  const midPoint = Math.ceil(questions.length / 2);
  const col1Questions = questions.slice(0, midPoint);
  const col2Questions = questions.slice(midPoint);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Top Action Toolbar (Hidden during actual print) */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-900 px-6 py-3 text-white shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Printer className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-black tracking-tight">Sınav Kitapçığı & PDF Yazdırma Motoru</h2>
            <p className="text-[0.68rem] font-bold text-slate-400">
              MEB & ÖSYM standartlarında A4 2-sütunlu sınav kağıdı ve optik form
            </p>
          </div>
        </div>

        {/* Print Configuration Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowAnswerKey((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-bold transition ${
              showAnswerKey
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {showAnswerKey ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            <span>Cevap Anahtarı & Çözümler</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOpticalSheet((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-bold transition ${
              showOpticalSheet
                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>Optik Kodlama Kutusu</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="tap-scale flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 font-black text-white shadow-md hover:brightness-110"
          >
            <Printer className="size-4" />
            <span>PDF Olarak Kaydet / Yazdır 🖨️</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Printable Exam Sheet Container (Simulates real A4 on screen, exact A4 when printed) */}
      <div className="mx-auto my-6 w-full max-w-4xl p-4 print:m-0 print:p-0 print:max-w-none">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-black shadow-2xl print:border-none print:p-4 print:shadow-none font-serif">
          
          {/* Header Section with Official School & Student Box */}
          <div className="border-2 border-black p-4 mb-5">
            {/* School / Institution Title */}
            <div className="text-center border-b-2 border-black pb-3">
              <input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full text-center text-base sm:text-lg font-black uppercase tracking-wider outline-none bg-transparent font-sans"
              />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans mt-0.5">
                2026-2027 EĞİTİM VE ÖĞRETİM YILI KAZANIM DEĞERLENDİRME DENEME SINAVI
              </p>
              <h1 className="mt-1 text-xl font-black uppercase text-black font-sans">
                {title}
              </h1>
              {description ? (
                <p className="text-[0.75rem] italic text-slate-600 font-sans">{description}</p>
              ) : null}
            </div>

            {/* Student Identification & Exam Meta Grid */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-sans font-semibold">
              <div className="space-y-1">
                <p><strong>Öğrenci Adı Soyadı:</strong> .....................................................</p>
                <p><strong>Sınıfı / Şubesi:</strong> ....................   <strong>Numarası:</strong> ....................</p>
              </div>

              <div className="space-y-1">
                <p><strong>Ders / Seviye:</strong> {targetGrade || "Tüm Sınıflar"}</p>
                <p><strong>Soru Sayısı:</strong> {questions.length} Soru</p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <div className="border border-black px-3 py-1 text-center">
                  <span className="text-[0.65rem] font-bold block uppercase">Sınav Süresi</span>
                  <span className="font-bold text-sm">{examDuration} Dk</span>
                </div>
                <div className="border-2 border-black px-4 py-1 text-center min-w-20">
                  <span className="text-[0.65rem] font-black block uppercase">Aldığı Puan</span>
                  <span className="font-mono text-sm font-bold">[ &nbsp; &nbsp; &nbsp; / 100 ]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sınav Yönergesi */}
          <div className="mb-4 text-[0.72rem] leading-relaxed text-slate-700 border-l-4 border-black pl-3 py-1 font-sans">
            <strong>YÖNERGE:</strong> Bu sınavda toplam <strong>{questions.length} soru</strong> yer almaktadır. Soru köklerini dikkatlice okuyunuz ve bulduğunuz doğru seçeneği soru yanındaki harfi daire içine alarak veya sayfa sonundaki optik forma işaretleyiniz. Başarılar dileriz.
          </div>

          {/* Two-Column Question Layout (Standard MEB / ÖSYM Booklet Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-black pt-4">
            {/* Column 1 */}
            <div className="space-y-6 pr-0 md:pr-4 md:border-r border-dashed border-slate-400">
              {col1Questions.map((q, idx) => (
                <QuestionItemView key={idx} question={q} number={idx + 1} />
              ))}
            </div>

            {/* Column 2 */}
            <div className="space-y-6 pl-0 md:pl-2">
              {col2Questions.map((q, idx) => (
                <QuestionItemView key={idx} question={q} number={midPoint + idx + 1} />
              ))}
            </div>
          </div>

          {/* Mini Optical Answer Sheet (Real Bubble Grid on paper) */}
          {showOpticalSheet && (
            <div className="mt-8 border-2 border-black p-4 break-inside-avoid font-sans">
              <div className="flex items-center justify-between border-b border-black pb-2 mb-3">
                <span className="text-xs font-black uppercase tracking-wider">
                  📋 OPTİK CEVAP FORMU (KODLAMA ALANI)
                </span>
                <span className="text-[0.68rem] text-slate-500">
                  Cevaplarınızı kurşun kalemle dairenin içini tam doldurarak kodlayınız.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {questions.map((q, idx) => {
                  const optCount = q.options.length;
                  const isTF = q.type === "true_false";

                  return (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                      <span className="w-5 font-black text-right text-[0.75rem]">
                        {idx + 1}.
                      </span>
                      <div className="flex gap-1">
                        {isTF ? (
                          <>
                            <span className="flex size-5.5 items-center justify-center rounded-full border border-black text-[0.65rem] font-bold">
                              D
                            </span>
                            <span className="flex size-5.5 items-center justify-center rounded-full border border-black text-[0.65rem] font-bold">
                              Y
                            </span>
                          </>
                        ) : (
                          Array.from({ length: optCount }, (_, oi) => (
                            <span
                              key={oi}
                              className="flex size-5.5 items-center justify-center rounded-full border border-black text-[0.65rem] font-bold"
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teacher Answer Key & Solutions Booklet (Optional separate printable section) */}
          {showAnswerKey && (
            <div className="mt-8 pt-6 border-t-2 border-black break-before-page break-inside-avoid font-sans">
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-black">
                    🔑 ÖĞRETMEN CEVAP ANAHTARI & ÇÖZÜM ADIMLARI
                  </h3>
                  <p className="text-[0.68rem] text-slate-600">
                    Sınav değerlendirme anahtarı ve öğrencilere dağıtılabilecek çözüm rehberi.
                  </p>
                </div>
                <span className="rounded-lg bg-black text-white px-2.5 py-1 text-xs font-black">
                  {questions.length} / {questions.length} Çözüm
                </span>
              </div>

              {/* Answer Key Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-5">
                {questions.map((q, idx) => {
                  const letter =
                    q.type === "true_false"
                      ? q.correctIndex === 0
                        ? "D"
                        : "Y"
                      : String.fromCharCode(65 + (q.correctIndex ?? 0));

                  return (
                    <div
                      key={idx}
                      className="border border-black rounded-lg p-2 text-center bg-slate-50"
                    >
                      <span className="block text-[0.65rem] font-bold text-slate-500">
                        Soru {idx + 1}
                      </span>
                      <span className="block text-base font-black text-black">{letter}</span>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Solutions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Çözüm Notları ve Püf Noktaları:
                </h4>
                {questions.map((q, idx) => (
                  <div key={idx} className="border-l-2 border-indigo-600 pl-3 py-1 text-xs">
                    <p className="font-bold text-black">
                      {idx + 1}. Soru Çözümü (Doğru Cevap:{" "}
                      {q.type === "true_false"
                        ? q.correctIndex === 0
                          ? "Doğru"
                          : "Yanlış"
                        : String.fromCharCode(65 + (q.correctIndex ?? 0))}
                      ):
                    </p>
                    <p className="text-slate-700 mt-0.5 italic">
                      {q.explanation || "Bu soru için ek çözüm açıklaması eklenmemiştir."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Page Branding */}
          <div className="mt-8 border-t border-slate-300 pt-3 flex items-center justify-between text-[0.65rem] text-slate-400 font-sans">
            <span>Zigo Dijital Eğitim ve Sınav Ekosistemi · zigo.app</span>
            <span>Sayfa 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionItemView({ question, number }: { question: PrintableQuestion; number: number }) {
  const isTF = question.type === "true_false";

  return (
    <div className="break-inside-avoid space-y-2">
      {/* Soru Numarası & Metni */}
      <div className="flex items-start gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black text-white text-xs font-black font-sans">
          {number}
        </span>
        <div className="space-y-2 flex-1">
          {/* Question Image if any */}
          {question.imageUrl && (
            <div className="my-1 border border-slate-300 p-1 bg-slate-50 inline-block rounded max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={question.imageUrl}
                alt={`Soru ${number}`}
                className="max-h-44 object-contain"
              />
            </div>
          )}

          <p className="text-sm font-semibold leading-relaxed text-black">
            {question.text}
          </p>
        </div>
      </div>

      {/* Seçenekler */}
      <div className={`pl-8 space-y-1.5 text-xs font-sans ${isTF ? "flex gap-6 space-y-0" : ""}`}>
        {question.options.map((opt, oi) => {
          const letter = isTF ? (oi === 0 ? "A) Doğru" : "B) Yanlış") : `${String.fromCharCode(65 + oi)})`;

          return (
            <div key={oi} className="flex items-start gap-2">
              <span className="font-black shrink-0">{letter}</span>
              <span className="leading-snug">{opt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
