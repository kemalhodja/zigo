import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Zigo Plus Paketleri ve Fiyatlandırma | Ücretsiz Deneme",
  description:
    "Zigo Plus abonelik planları: Öğrenci, Veli, Öğretmen ve Kurumsal üyelikler. Öğretmenlere 30 gün (1 ay), öğrenci ve velilere 7 gün tam özellikli ücretsiz deneme ve %50 indirim fırsatı.",
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
    description: "Tam özellikli ücretsiz deneme süresi ve %50 indirim fırsatıyla Zigo Plus'ı keşfedin.",
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

