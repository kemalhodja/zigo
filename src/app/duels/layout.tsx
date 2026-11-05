import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Akademik Bilgi Düelloları | Canlı Quiz Yarışması",
  description:
    "Zigo Bilgi Düelloları: Türkçe, Matematik, Fen ve Sosyal alanlarında arkadaşlarınla veya diğer öğrencilerle canlı yarış, puanları topla ve ligde yüksel.",
  keywords: [
    "bilgi yarışması",
    "canlı quiz",
    "öğrenci düellosu",
    "lgs bilgi yarışması",
    "akademik düello",
  ],
  alternates: {
    canonical: "/duels",
  },
};

export default function DuelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
