import type { Metadata } from "next";
import Link from "next/link";

import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Zigo Kişisel Verilerin Korunması Kanunu aydınlatma metni.",
  alternates: {
    canonical: "/legal/kvkk",
  },
};

export default function KvkkPage() {
  return (
    <LegalLayout title="KVKK Aydınlatma Metni">
      <p>
        Veri sorumlusu: Zigo Eğitim Teknolojileri. İşlenen veriler: kimlik (ad-soyad), iletişim (e-posta), rol ve
        eğitim alanı tercihleri, öğrenme/sınav etkinlikleri, moderasyon kayıtları ve veli onaylı çocuk profili
        verileri. Uygulamada üçüncü taraf reklam takibi veya reklam ağı bulunmaz.
      </p>
      <p>
        Amaç: Match-Feed eğitim akışı, güvenli sosyal etkileşim, oyunlaştırma, veli denetimi, abonelik yönetimi ve
        yasal yükümlülüklerin yerine getirilmesi. Hukuki sebep: sözleşmenin kurulması ve ifası, meşru menfaat ve açık
        rıza (çocuk profili/veli onayı).
      </p>

      <h2 className="pt-2 text-base font-black text-night">Çocuk verileri</h2>
      <p>
        Bağlı çocuk profilleri veli hesabı altında yönetilir. Öğrenciler arası doğrudan mesajlaşma sunulmaz. Öğrenci ve
        veli paylaşımları Keşfet akışına ve arama motorlarına kapalıdır; tüm içerikler güvenlik moderasyonundan geçer.
        Veli, çocuğun eğitim alanı tercihleri, çalışma özetleri ve oyun süreleri üzerinde tam denetim sahibidir.
      </p>

      <h2 className="pt-2 text-base font-black text-night">Aktarım ve ödeme altyapısı</h2>
      <p>
        Veriler güvenli Supabase altyapısında saklanır. Abonelik ödemeleri Android uygulamasında Google Play
        Faturalandırma üzerinden, web sürümünde ise EFT / Havale / FAST ve yapılandırılan ödeme sağlayıcıları
        aracılığıyla yürütülür; ödeme kartı bilgileri Zigo sunucularında tutulmaz. Kayıt güvenliği için Google
        reCAPTCHA kullanılabilir. Kişisel veriler üçüncü taraflara satılmaz.
      </p>

      <p>
        Haklarınız: KVKK md. 11 kapsamında erişim, düzeltme, silme ve itiraz. Başvuru: kvkk@zigo.com.tr veya{" "}
        <Link className="font-black text-crystal" href="/legal/delete-account">
          hesap ve veri sayfası
        </Link>
        .
      </p>
    </LegalLayout>
  );
}
