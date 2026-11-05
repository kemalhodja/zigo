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
