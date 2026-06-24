import Link from "next/link";

import { LegalLayout } from "@/components/legal-layout";

export default function KvkkPage() {
  return (
    <LegalLayout title="KVKK Aydınlatma Metni">
      <p>
        Veri sorumlusu: Zigo Education Platform. İşlenen veriler: kimlik (ad), iletişim (e-posta), eğitim alanı
        tercihleri, öğrenme etkinlikleri, moderasyon kayıtları ve veli onaylı çocuk profili verileri.
      </p>
      <p>
        Amaç: Match-Feed eğitim akışı, güvenli sosyal etkileşim, gamification, veli denetimi ve yasal yükümlülükler.
        Hukuki sebep: sözleşmenin kurulması, meşru menfaat ve açık rıza (çocuk profili/veli onayı).
      </p>

      <h2 className="pt-2 text-base font-black text-night">Çocuk verileri</h2>
      <p>
        Çocuk profilleri veli hesabı altında yönetilir. Çocuğa ait e-posta toplanmaz; öğrenciler arası doğrudan
        mesajlaşma sunulmaz. Öğrenci görünür içerik moderasyondan geçer. Veli, çocuğun eğitim alanı tercihleri ve
        öğrenme özetlerine erişir.
      </p>

      <h2 className="pt-2 text-base font-black text-night">Aktarım</h2>
      <p>
        Veriler Supabase altyapısında saklanır. Ödeme işlemleri Stripe üzerinden yürütülür. Kayıt güvenliği için Google
        reCAPTCHA kullanılabilir. Kişisel veriler üçüncü taraflara satılmaz.
      </p>

      <p>
        Haklarınız: KVKK md. 11 kapsamında erişim, düzeltme, silme, itiraz. Başvuru: kvkk@zigo.app veya{" "}
        <Link className="font-black text-crystal" href="/legal/delete-account">
          hesap ve veri sayfası
        </Link>
        .
      </p>
    </LegalLayout>
  );
}
