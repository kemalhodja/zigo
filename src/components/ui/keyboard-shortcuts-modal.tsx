"use client";

import { useEffect, useState } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: "A veya 1", desc: "A şıkkını seç" },
    { key: "B veya 2", desc: "B şıkkını seç" },
    { key: "C veya 3", desc: "C şıkkını seç" },
    { key: "D veya 4", desc: "D şıkkını seç" },
    { key: "E veya 5", desc: "E şıkkını seç" },
    { key: "Enter / Space", desc: "Cevabı onayla & sonraki soruya geç" },
    { key: "F / F11", desc: "Akıllı Tahta / Tam Ekran modu" },
    { key: "?", desc: "Kısayol rehberini aç/kapat" },
    { key: "Esc", desc: "Pencereyi kapat" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-purple-100 text-sm font-black text-purple-700">
              ⌨️
            </span>
            <h3 className="text-lg font-black text-slate-900">Masaüstü Klavye Kısayolları</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-500">
          Zigo Quiz Arena&apos;da fare kullanmadan şimşek hızında soru çözmek için bu kısayolları kullanabilirsiniz:
        </p>

        <div className="mt-4 space-y-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
            >
              <span>{sc.desc}</span>
              <kbd className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[0.7rem] font-black text-slate-900 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="tap-scale w-full rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-slate-800"
          >
            Anladım, Harika!
          </button>
        </div>
      </div>
    </div>
  );
}
