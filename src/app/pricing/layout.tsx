import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Zigo Plus Paketleri ve Fiyatlandırma | 7 Gün Ücretsiz Deneme",
  description:
    "Zigo Plus abonelik planları: Öğrenci, Veli, Öğretmen ve Kurumsal üyelikler. İlk 7 gün tam özellikli ücretsiz deneme, %50 lansman indirimi ve güvenli banka havalesi.",
  keywords: [
    "zigo plus fiyatları",
    "zigo abonelik",
    "eğitim platformu üyelik",
    "öğrenci koçluğu fiyatları",
    "öğretmen stüdyosu",
    "havale ile eğitim paketi",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Zigo Plus Paketleri ve Fiyatlandırma",
    description: "İlk 7 gün tam özellikli ücretsiz deneme ile Zigo Plus'ı keşfedin.",
    url: "https://www.zigo.com.tr/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

