import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
  description: "Zigo kullanım şartları, topluluk kuralları ve platform politikaları."
};

export default function TermsPage() {
  return (
    <LegalLayout title="Kullanım Şartları">
      <p>Zigo; öğretmen, veli ve öğrenciler için bir eğitim platformudur. Doğrulanmış öğretmenler atanan eğitim alanlarında içerik yayınlar. Öğrenci ve veliler eşleşen içeriği tüketir; bağımsız gönderi paylaşamaz.</p>
      <p>Hesap bilgileri doğru olmalıdır. Taciz, öğrencilerin platform dışı iletişim girişimleri ve doğrulanmamış yayın yasaktır. Zigo Plus abonelikleri Stripe üzerinden iptal edilene kadar aylık yenilenir.</p>
      <p>Beta sürecinde hizmet olduğu gibi sunulur. Kritik güvenlik sorunlarını uygulama içi bildirimle iletin.</p>

      <h2 className="pt-2 text-base font-black text-night">Öğrenci güvenliği</h2>
      <p>Öğrenciler birbirine doğrudan mesaj gönderemez. Yorumlar ve açık metinler moderasyondan geçer. Uygunsuz içerik bildirimi uygulama içinden yapılabilir. Öğretmenler yalnızca doğrulanmış ve atanmış eğitim alanlarında yayın yapabilir.</p>
      <p>Sponsorlu eğitim içerikleri açık şekilde etiketlenir; üçüncü taraf reklam ağı kullanılmaz. Veliler bağlı öğrenci profili ve ödül onaylarından sorumludur.</p>
    </LegalLayout>
  );
}
