import type { Metadata } from "next";
import Link from "next/link";

import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Zigo gizlilik politikası ve kullanıcı verilerinin korunması.",
  alternates: {
    canonical: "/legal/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Gizlilik Politikası">
      <p>
        Zigo; öğrenciler, veliler, öğretmenler, eğitim kurumları, eğitim platformları ve yayınevleri için tasarlanmış
        reklamsız ve güvenli bir eğitim sosyal ağıdır. Hesap e-postası, profil adı, rol, öğrenme etkinlikleri, eğitim
        alanı tercihleri ve yüklenen medyayı yalnızca platform hizmetlerini, güvenliği ve oyunlaştırma özelliklerini
        çalıştırmak için işleriz. Uygulamada üçüncü taraf reklam ağı (AdMob vb.) kesinlikle bulunmaz.
      </p>
      <p>
        Öğrenci metinleri gösterilmeden önce moderasyondan geçer. Kişisel verileri asla satmayız. Veriler KVKK
        kapsamında, yapılandırılan güvenli Supabase altyapısında saklanır.
      </p>
      <p>
        İletişim: privacy@zigo.com.tr · Ayrıca{" "}
        <Link className="font-black text-crystal" href="/legal/delete-account">
          verilerini indirebilir veya hesap silme talep edebilirsin
        </Link>{" "}
        — uygulama içi KVKK sayfasından.
      </p>

      <h2 className="pt-2 text-base font-black text-night">Öğrenciler ve aileler</h2>
      <p>
        Zigo LGS, YKS adayları, öğrenciler ve veliler için güvenli olarak tasarlanmıştır. Öğrenciler arası doğrudan
        mesajlaşma sunulmaz. Öğrenci ve veli gönderileri Keşfet&apos;e veya arama motorlarına açılmaz; yalnızca karşılıklı
        takipleşen kullanıcıların ana sayfa akışında görünür. Tüm metinler küfür, +18 ve zorbalık filtrelerinden geçer;
        tekrarlayan ihlallerde paylaşım kısıtlanabilir.
      </p>
      <p>
        Veliler bağlı çocuklarının eğitim alanı tercihlerini, çalışma ve odak analitiğini, oyun süresi kurallarını
        (08:00–22:00 arası, günde en fazla 2 saat) ve mağaza ödül onaylarını yönetir. Hesap açılışı ve kullanım için
        zorunlu resmi belge yükleme şartı aranmaz.
      </p>

      <h2 className="pt-2 text-base font-black text-night">Üçüncü taraflar ve ödeme altyapısı</h2>
      <p>
        Verileriniz hizmet sağlayıcılarla yalnızca platformu çalıştırmak için paylaşılır: Supabase (kimlik doğrulama,
        veritabanı ve medya depolama), Google Play Faturalandırma (Android uygulama içi Zigo Plus abonelikleri), web
        tarafında EFT / Havale / FAST ile yapılan abonelik onayları ve yapılandırılmış ödeme sağlayıcıları (kart
        bilgileri hiçbir zaman Zigo sunucularında saklanmaz) ile kayıt güvenliği için Google reCAPTCHA. Bu taraflara
        veri satışı yapılmaz.
      </p>

      <h2 className="pt-2 text-base font-black text-night">Güvenlik ve saklama</h2>
      <p>
        İletişim TLS ile şifrelenir. Oturum çerezleri kimlik doğrulama için kullanılır; çerez tercihi cihazınızda yerel
        olarak saklanır. Hesap silme talebi alındığında veriler makul süre içinde silinir veya anonimleştirilir.
        Güvenlik ihlali şüphesinde kvkk@zigo.com.tr adresine yazın.
      </p>
    </LegalLayout>
  );
}
