import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description: "Zigo Plus aboneliği ve fiyatlandırma seçenekleri."
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center text-slate-900 bg-white">
      <h1 className="zigo-display mb-4">Abonelik Seçenekleri</h1>
      <p className="zigo-body-text mb-8 max-w-md text-slate-600">
        Öğrenme yolculuğuna tam erişim ile devam et.
      </p>

      <div className="border border-slate-200 rounded-xl p-8 bg-slate-50 shadow-xl max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-2">Aylık Abonelik</h2>
        <p className="text-4xl font-black text-white mb-6">₺99<span className="text-sm font-normal text-slate-500"> /ay</span></p>
        <button className="w-full bg-crystal text-white rounded-xl py-3 font-bold hover:bg-crystal/90 transition-colors">
          Yakında
        </button>
      </div>
    </div>
  );
}
