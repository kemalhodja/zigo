import React from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.zigo.com.tr";

/**
 * Ana Sayfa ve Tüm Sitede Geçerli Schema.org Yapılandırılmış Verisi (JSON-LD)
 * Google Arama Sonuçlarında Zigo'nun Zengin Snippet (Rich Results), Site İçi Arama Kutusu
 * ve Bilgi Grafiği (Knowledge Graph) ile en üstte görünmesini sağlar.
 */
export function JsonLd() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zigo",
    alternateName: [
      "Zigo Eğitim",
      "Zigo Sosyal",
      "Zigo App",
      "Zigo Eğitim Sosyal Ağı",
    ],
    url: SITE_URL,
    description:
      "Türkiye'nin lider eğitim sosyal ağı: LGS ve YKS hazırlığı, puan hesaplama robotu, doğrulanmış öğretmenler ve interaktif dersler.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "tr-TR",
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Zigo",
    url: SITE_URL,
    logo: `${SITE_URL}/icon-maskable.svg`,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      "Öğrenciler, öğretmenler ve veliler için güvenli, oyunlaştırılmış ve doğrulanmış eğitim platformu.",
    sameAs: [
      "https://www.instagram.com/zigoapp",
      "https://twitter.com/zigoapp",
      "https://www.youtube.com/@zigoapp",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "destek@zigo.com.tr",
      availableLanguage: ["Turkish"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "TR",
    },
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zigo",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, Android, iOS",
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
      description: "7 gün tam özellikli ücretsiz deneme sürümü",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "2026 MEB Uyumlu LGS Puan Hesaplama Robotu",
      "2026 ÖSYM Uyumlu YKS TYT, AYT ve YDT Puan Hesaplama",
      "Okul Başarı Puanı (OBP) ve Kırık OBP Hesaplama",
      "e-Okul, YÖK Atlas ve OGM Materyal Entegrasyonları",
      "Doğrulanmış Öğretmenlerle Soru-Cevap",
      "Zeka Oyunları Salonu ve Odak Odaları",
      "Veli Takip ve İlerleme Raporları",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
    </>
  );
}

/**
 * /exams sayfası için Google Zengin Sonuçlar (FAQ Rich Snippet)
 * Öğrencilerin Google'da arattığı sık sorulan soruları arama sonuç sayfasında doğrudan açılır kutu olarak gösterir.
 */
export function ExamFaqJsonLd() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "LGS puanı 2026 yılında nasıl hesaplanır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "2026 MEB LGS puanı; Türkçe, Matematik ve Fen Bilimleri testleri 4 katsayı, İnkılap Tarihi, Din Kültürü ve Yabancı Dil testleri 1 katsayı ile ağırlıklandırılarak standart sapma formülleriyle hesaplanır. LGS'de 3 yanlış 1 doğruyu götürür ve taban puan 100, tavan puan 500'dür. Zigo üzerinden netlerinizi girerek resmi standart sapma puanınızı anında hesaplayabilirsiniz.",
        },
      },
      {
        "@type": "Question",
        name: "YKS (TYT ve AYT) puan hesabı nasıl yapılır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "YKS puanı hesaplanırken TYT puanının %40'ı, AYT veya YDT puanının ise %60'ı alınır. TYT'de 4 test (Türkçe 40, Sosyal 20, Temel Matematik 40, Fen 20) bulunur. YKS'de 4 yanlış 1 doğru cevabı götürür. Ham puanın üzerine adayın diploma notundan hesaplanan OBP (Okul Başarı Puanı) eklenerek yerleştirme puanı oluşturulur.",
        },
      },
      {
        "@type": "Question",
        name: "OBP (Okul Başarı Puanı) kaç puan ekler ve Kırık OBP nedir?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lise mezuniyet diploma notu 5 ile çarpılarak adayın OBP'si bulunur (100 diploma notu = 500 OBP). Standart yerleştirmede OBP 0.12 katsayısı ile çarpılır ve adayın ham puanına maksimum 60 puan eklenir. Ancak bir önceki yıl üniversitede bir programa yerleşen adayların katsayısı yarıya düşer (0.06 ile çarpılır, Kırık OBP) ve maksimum 30 puan eklenir.",
        },
      },
      {
        "@type": "Question",
        name: "YÖK Atlas ve e-Okul bağlantılarına Zigo üzerinden nasıl ulaşılır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Zigo; öğrenci, veli ve öğretmen profillerinde e-Okul, YÖK Atlas ve MEB OGM Materyal sistemlerine tek tıkla doğrudan resmi bağlantı sağlar. YKS puanınızı hesapladıktan sonra YÖK Atlas üzerinden geçmiş yılların üniversite taban puanlarını ve kontenjanlarını doğrudan inceleyebilirsiniz.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

/**
 * LGS Puan Hesaplama Sayfası Özel FAQ Schema'sı
 */
export function LgsFaqJsonLd() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "LGS'de 3 yanlış 1 doğruyu götürür mü?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Evet. MEB Merkezi Sınav kurallarına göre her alt testte 3 yanlış cevap 1 doğru cevabı eksiltir. Net sayısı = Doğru Sayısı - (Yanlış Sayısı / 3) formülü ile hesaplanır. Boş bırakılan sorular puanı etkilemez.",
        },
      },
      {
        "@type": "Question",
        name: "LGS en yüksek puan kaçtır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "LGS'de alınabilecek en yüksek puan 500 tam puandır. 90 sorunun tamamını doğru yapan adaylar Türkiye birincisi olarak 500 tam puan alır. Taban puan ise 100'dür.",
        },
      },
      {
        "@type": "Question",
        name: "LGS'de hangi dersler kaç katsayıdır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Türkçe (20 soru): 4 katsayı, Matematik (20 soru): 4 katsayı, Fen Bilimleri (20 soru): 4 katsayı, T.C. İnkılap Tarihi ve Atatürkçülük (10 soru): 1 katsayı, Din Kültürü ve Ahlak Bilgisi (10 soru): 1 katsayı, Yabancı Dil (10 soru): 1 katsayı.",
        },
      },
      {
        "@type": "Question",
        name: "LGS yüzdelik dilim nasıl hesaplanır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yüzdelik dilim, adayın Türkiye genelinde sınava giren yaklaşık 1 milyon öğrenci arasındaki başarı sırasının yüzdesel karşılığıdır. Örneğin %1'lik dilim, sınava girenler arasında en başarılı ilk 10.000 öğrenci içinde olunduğunu gösterir.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

/**
 * YKS Puan Hesaplama Sayfası Özel FAQ Schema'sı
 */
export function YksFaqJsonLd() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "YKS 0.5 net kuralı nedir?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ÖSYM kuralına göre TYT puanının hesaplanabilmesi için adayın Temel Matematik veya Türkçe testlerinin en az birinden 0.5 veya daha fazla ham net çıkarması zorunludur. AYT puan türleri için de ilgili testlerde 0.5 net şartı aranır.",
        },
      },
      {
        "@type": "Question",
        name: "YKS'de 4 yanlış 1 doğruyu götürür mü?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Evet. ÖSYM YKS sınavında (TYT, AYT ve YDT) her 4 yanlış cevap 1 doğru cevabı siler. Net = Doğru - (Yanlış / 4) olarak hesaplanır.",
        },
      },
      {
        "@type": "Question",
        name: "OBP üniversite yerleştirmesine ne kadar etki eder?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lise diploma notu 5 ile çarpılarak 250-500 arası OBP bulunur. Bu puan 0.12 ile çarpılarak adayın ham puanına 30 ila 60 puan arasında yerleştirme puanı eklenir.",
        },
      },
      {
        "@type": "Question",
        name: "Kırık OBP katsayısı nedir ve kimlere uygulanır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bir önceki yıl merkezi yerleştirme ile bir lisans veya önlisans programına yerleşen (açıköğretim kontenjanlı bölümler dahil) adayların OBP katsayısı 0.12 yerine 0.06 olarak yarı yarıya düşürülür. Bu duruma halk arasında Kırık OBP denir.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

/**
 * Google BreadcrumbList (Arama Sonuçlarında Ekmek Kırıntısı Gösterimi)
 */
export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}

