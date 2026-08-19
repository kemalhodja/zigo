import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yardım ve SSS",
  description: "Zigo kullanımı hakkında sıkça sorulan sorular ve destek."
};

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center p-8 text-slate-100 bg-slate-950">
      <h1 className="text-3xl font-black text-crystal mb-8 mt-12">Yardım Merkezi</h1>
      <div className="max-w-2xl w-full space-y-6">
        <div className="border border-slate-800 rounded-xl p-6 bg-slate-900">
          <h2 className="text-xl font-bold text-white mb-2">Zigo ücretsiz mi?</h2>
          <p className="text-slate-400">Evet, Zigo'nun temel özellikleri öğrenciler ve veliler için tamamen ücretsizdir.</p>
        </div>
        <div className="border border-slate-800 rounded-xl p-6 bg-slate-900">
          <h2 className="text-xl font-bold text-white mb-2">Öğrenciler nasıl korunur?</h2>
          <p className="text-slate-400">Öğrenciler arası doğrudan mesajlaşma yoktur. Açık metinler zorbalık ve küfür filtrelerinden geçer.</p>
        </div>
      </div>
    </div>
  );
}
