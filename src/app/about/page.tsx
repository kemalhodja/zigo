import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Zigo Eğitim Sosyal Ağı hakkında bilgiler."
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center text-slate-900 bg-white">
      <h1 className="text-4xl font-black text-crystal mb-6">Zigo Hakkında</h1>
      <p className="max-w-xl text-lg text-slate-600 mb-8 leading-relaxed">
        Zigo, öğrencilerin güvenle öğrenebileceği, öğretmenlerin içerik paylaşarak öğrencilere 
        ulaşabileceği yenilikçi ve oyunlaştırılmış bir eğitim platformudur.
      </p>
      <Link href="/" className="bg-crystal text-white px-8 py-3 rounded-xl font-bold hover:bg-crystal/90 transition-colors">
        Anasayfaya Dön
      </Link>
    </div>
  );
}
