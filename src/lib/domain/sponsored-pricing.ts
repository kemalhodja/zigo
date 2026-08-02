export type SponsorPackageDuration = 7 | 30;

export type SponsorPricingOption = {
  days: SponsorPackageDuration;
  label: string;
  durationLabel: string;
  priceTry: number;
  description: string;
  features: string[];
};

export type SponsorCategoryType = "platform" | "institution" | "teacher";

export function resolveSponsorCategory(profile?: {
  role?: string | null;
  organization_type?: string | null;
} | null): SponsorCategoryType {
  if (!profile) return "teacher";
  const orgType = profile.organization_type;
  if (orgType === "egitim_platformu") return "platform";
  if (orgType === "kurs" || orgType === "okul" || orgType === "egitim_kurumu" || orgType === "yayinevi") {
    return "institution";
  }
  return "teacher";
}

export function getSponsorPricingOptions(
  profile?: { role?: string | null; organization_type?: string | null } | null,
): SponsorPricingOption[] {
  const category = resolveSponsorCategory(profile);

  if (category === "platform") {
    return [
      {
        days: 7,
        label: "Haftalık Sponsorlu Paket",
        durationLabel: "7 Günlük Gösterim",
        priceTry: 2500,
        description: "Eğitim platformunuzu 1 hafta boyunca Zigo keşfet ve akışında öne çıkarın.",
        features: [
          "Profil vitrininde ✨ Sponsorlu Platform rozeti",
          "Öğrenci ve veli akışlarında öncelikli gösterim",
          "Tüm kullanıcılara filtresiz ve sınırsız erişim",
          "Detaylı tıklama ve görüntülenme analitiği",
        ],
      },
      {
        days: 30,
        label: "Aylık Sponsorlu Paket",
        durationLabel: "30 Günlük Gösterim (Avantajlı)",
        priceTry: 8000,
        description: "30 gün boyunca kesintisiz maksimum görünürlük ve marka bilinirliği.",
        features: [
          "Profil vitrininde ✨ Sponsorlu Platform rozeti",
          "Öğrenci ve veli akışlarında öncelikli ve üst sırada gösterim",
          "Tüm kullanıcılara filtresiz ve sınırsız erişim",
          "Detaylı tıklama ve görüntülenme analitiği",
          "Haftalık pakete göre %20'den fazla fiyat avantajı",
        ],
      },
    ];
  }

  if (category === "institution") {
    return [
      {
        days: 7,
        label: "Haftalık Kurumsal Sponsorluk",
        durationLabel: "7 Günlük Gösterim",
        priceTry: 3000,
        description: "Okul veya kurs merkezinizi 1 hafta boyunca bölgenizde ve tüm akışta öne çıkarın.",
        features: [
          "Profil vitrininde ✨ Sponsorlu Eğitim Kurumu rozeti",
          "Hedeflenen kademe veya genel akışta üst sırada gösterim",
          "Tüm kullanıcılara doğrudan görünürlük",
          "Kayıt ve başvuru butonuna doğrudan trafik",
        ],
      },
      {
        days: 30,
        label: "Aylık Kurumsal Sponsorluk",
        durationLabel: "30 Günlük Gösterim (Avantajlı)",
        priceTry: 10000,
        description: "1 ay boyunca bölgenizdeki tüm öğrenci ve velilerin ana ekranında yer alın.",
        features: [
          "Profil vitrininde ✨ Sponsorlu Eğitim Kurumu rozeti",
          "Hedeflenen kademe veya genel akışta üst sırada gösterim",
          "Tüm kullanıcılara doğrudan görünürlük",
          "Kayıt ve başvuru butonuna doğrudan trafik",
          "Aylık kesintisiz kurumsal marka gücü",
        ],
      },
    ];
  }

  // Individual Teacher
  return [
    {
      days: 7,
      label: "Haftalık Öğretmen Sponsorluğu",
      durationLabel: "7 Günlük Gösterim",
      priceTry: 1000,
      description: "Bireysel profilinizi ve özel ders ilanınızı 1 hafta boyunca öne çıkarın.",
      features: [
        "Profil vitrininde ✨ Sponsorlu Öğretmen rozeti",
        "Ders talebi arayan veli akışlarında öncelikli gösterim",
        "Branş aramalarda üst sıralarda yer alma",
        "Doğrudan ders talebi ve mesajlaşma artışı",
      ],
    },
    {
      days: 30,
      label: "Aylık Öğretmen Sponsorluğu",
      durationLabel: "30 Günlük Gösterim (Avantajlı)",
      priceTry: 3000,
      description: "1 ay boyunca branşınızda en çok öne çıkan ve tercih edilen öğretmen olun.",
      features: [
        "Profil vitrininde ✨ Sponsorlu Öğretmen rozeti",
        "Ders talebi arayan veli akışlarında öncelikli gösterim",
        "Branş aramalarda üst sıralarda yer alma",
        "Doğrudan ders talebi ve mesajlaşma artışı",
        "Haftalık pakete göre ekstra fiyat avantajı",
      ],
    },
  ];
}

export function formatSponsorPriceTry(priceTry: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(priceTry);
}
