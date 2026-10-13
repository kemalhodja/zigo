"use client";

import { useState } from "react";
import { Calculator, Check, Sparkles } from "lucide-react";

interface MathFormulaHelperProps {
  onInsert: (symbol: string) => void;
  previewText?: string;
}

const MATH_SYMBOLS = [
  // Powers & Roots
  { label: "x²", insert: "²", title: "Kare" },
  { label: "x³", insert: "³", title: "Küp" },
  { label: "xⁿ", insert: "ⁿ", title: "Üs" },
  { label: "√x", insert: "√", title: "Karekök" },
  { label: "∛x", insert: "∛", title: "Küp Kök" },
  { label: "a/b", insert: " / ", title: "Bölme / Kesir" },

  // Greek / Geometry
  { label: "π", insert: "π", title: "Pi sayısı" },
  { label: "θ", insert: "θ", title: "Teta" },
  { label: "α", insert: "α", title: "Alfa" },
  { label: "β", insert: "β", title: "Beta" },
  { label: "Δ", insert: "Δ", title: "Delta" },
  { label: "°", insert: "°", title: "Derece" },
  { label: "∠", insert: "∠", title: "Açı" },
  { label: "⊥", insert: "⊥", title: "Diklik" },

  // Comparators & Operations
  { label: "±", insert: "±", title: "Artı Eksi" },
  { label: "≠", insert: "≠", title: "Eşit Değil" },
  { label: "≤", insert: "≤", title: "Küçük Eşit" },
  { label: "≥", insert: "≥", title: "Büyük Eşit" },
  { label: "≈", insert: "≈", title: "Yaklaşık Eşit" },
  { label: "∞", insert: "∞", title: "Sonsuz" },
  { label: "×", insert: "×", title: "Çarpma" },
  { label: "÷", insert: "÷", title: "Bölme" },

  // Subscripts
  { label: "x₁", insert: "₁", title: "İndis 1" },
  { label: "x₂", insert: "₂", title: "İndis 2" },
  { label: "x₀", insert: "₀", title: "İndis 0" },
];

export function MathFormulaHelper({ onInsert, previewText }: MathFormulaHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  function handleSelect(sym: string) {
    onInsert(sym);
    setCopiedSymbol(sym);
    setTimeout(() => setCopiedSymbol(null), 1000);
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="flex items-center gap-2 font-black text-indigo-700 hover:text-indigo-900"
        >
          <Calculator className="size-4" />
          <span>Matematik & Formül Araç Çubuğu</span>
          <span className="rounded-md bg-indigo-200/60 px-1.5 py-0.5 text-[0.65rem] font-bold text-indigo-800">
            {isOpen ? "Gizle ▲" : "Hızlı Ekle ▼"}
          </span>
        </button>

        {previewText && (
          <span className="flex items-center gap-1 text-[0.7rem] font-bold text-slate-500">
            <Sparkles className="size-3 text-amber-500" />
            Canlı Önizleme Aktif
          </span>
        )}
      </div>

      {isOpen && (
        <div className="mt-3 space-y-3 animate-in fade-in duration-150">
          <p className="text-[0.7rem] text-slate-500 font-semibold">
            Sorunuza veya seçeneklerinize eklemek istediğiniz matematik sembolüne tıklayın:
          </p>

          <div className="flex flex-wrap gap-1.5">
            {MATH_SYMBOLS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(s.insert)}
                title={s.title}
                className="tap-scale flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 font-mono text-xs font-black text-slate-800 shadow-2xs hover:border-indigo-400 hover:bg-indigo-50"
              >
                <span>{s.label}</span>
                {copiedSymbol === s.insert && <Check className="size-3 text-emerald-600" />}
              </button>
            ))}
          </div>

          {previewText && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-inner">
              <span className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-400 mb-1">
                Öğrenci Ekranında Görünüm:
              </span>
              <p className="text-sm font-black text-slate-900 leading-relaxed font-sans">
                {previewText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
