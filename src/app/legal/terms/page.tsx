import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
  description: "Zigo kullanım şartları, topluluk kuralları ve platform politikaları.",
  alternates: {
    canonical: "/legal/terms",
  },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Kullanım Şartları">
      <p>
        Zigo; öğrenci, veli, öğretmen, eğitim kurumu, eğitim platformu ve yayınevi rollerine özel olarak tasarlanmış
        reklamsız bir eğitim platformudur. Öğretmen, kurum, platform ve yayınevi hesapları eğitim alanlarında kamuya
        açık içerik üretebilir (abonesiz günde en fazla 1 gönderi, Zigo Plus aboneliğiyle sınırsız). Zigo Plus abonesi
        öğrenci ve veliler ise günde en fazla 2 gönderi paylaşabilir; bu gönderiler Keşfet&apos;e düşmez ve yalnızca
        karşılıklı takipleşen kişilerin ana sayfasında görünür.
      </p>
      <p>
        Hesap bilgileri doğru olmalıdır. Taciz, öğrencilerin platform dışı iletişim girişimleri, spam ve telif hakkı
        ihlali yasaktır. Öğretmenler kayıttan itibaren ilk 30 gün, öğrenci ve veliler ise ilk 7 gün tam özellikli
        ücretsiz deneme hakkına sahiptir. Zigo Plus abonelikleri Android uygulamasında Google Play üzerinden, web
        sürümünde ise EFT / Havale / FAST veya aktif ödeme yöntemleriyle yönetilir.
      </p>
      <p>
        Kritik güvenlik veya içerik ihlallerini uygulama içi bildirimle ya da destek@zigo.com.tr üzerinden iletebilirsiniz.
      </p>

      <h2 className="pt-2 text-base font-black text-night">Öğrenci güvenliği ve oyun kuralları</h2>
      <p>
        Öğrenciler birbirine doğrudan mesaj gönderemez. Yorumlar ve açık metinler otomatik güvenlik filtrelerinden
        geçer. Zeka oyunları salonuna yalnızca Zigo Plus aboneleri erişebilir; abone öğrenciler günde en fazla 2 saat
        (120 dakika) ve yalnızca 08:00–22:00 saatleri arasında oyun oynayabilir (22:00–08:00 gece dinlenme kuralı).
      </p>
      <p>
        Platformda üçüncü taraf reklam ağı (AdMob vb.) kullanılmaz. Gönderilerde paylaşılan dış bağlantılara yalnızca
        Zigo Plus aboneleri erişebilir. Veliler bağlı öğrenci profili ve ödül onaylarından sorumludur.
      </p>
    </LegalLayout>
  );
}
