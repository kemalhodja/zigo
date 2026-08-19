import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Zigo Eğitim Sosyal Ağı hakkında bilgiler."
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center text-slate-100 bg-slate-950">
      <h1 className="text-3xl font-black text-crystal mb-4">Zigo Hakkında</h1>
      <p className="max-w-md text-slate-400">
        Zigo, öğrenci, öğretmen ve velileri güvenli bir eğitim sosyal ağında buluşturan platformdur. 
        Doğrulanmış içeriklerle öğrenmeyi bir oyun kadar eğlenceli hale getiririz.
      </p>
    </div>
  );
}
