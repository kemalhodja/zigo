import type { Metadata } from "next";
import Link from "next/link";

import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Zigo gizlilik politikası ve kullanıcı verilerinin korunması."
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Gizlilik Politikası">
      <p>Zigo, doğrulanmış eğitim sosyal ağıdır. Hesap e-postası, profil adı, rol, öğrenme etkinlikleri, eğitim alanı tercihleri ve yüklenen medyayı yalnızca Seçili alanlar, güvenlik ve oyunlaştırma özelliklerini çalıştırmak için işleriz.</p>
      <p>Öğrenci metinleri gösterilmeden önce moderasyondan geçer. Kişisel verileri satmayız. Veliler bağlı öğrenci profillerini ve ödül onaylarını denetler. Veriler KVKK kapsamında, yapılandırdığınız Supabase bölgesinde saklanır.</p>
      <p>
        İletişim: privacy@zigo.app · Ayrıca{" "}
        <Link className="font-black text-crystal" href="/legal/delete-account">
          verilerini indirebilir veya hesap silme talep edebilirsin
        </Link>{" "}
        — uygulama içi KVKK sayfasından.
      </p>

      <h2 className="pt-2 text-base font-black text-night">Öğrenciler ve aileler</h2>
      <p>Zigo YKS adayları, öğrenciler ve veliler için tasarlanmıştır. Bağlı öğrenci profilleri yalnızca veli hesabı altında oluşturulur; bu profillere e-posta veya öğrenciler arası doğrudan mesajlaşma eklenmez. Öğrenci görünür metinleri küfür, +18 ve zorbalık filtrelerinden geçer; tekrarlayan ihlallerde paylaşım kısıtlanabilir.</p>
      <p>Veliler öğrencilerinin eğitim alanı tercihlerini, YKS hazırlık etkinliklerini, odak analitiğini ve mağaza ödül onaylarını yönetir. Gerekli durumlarda öğrenci kimlik doğrulama belgesi yalnızca hesap güvenliği için istenebilir.</p>

      <h2 className="pt-2 text-base font-black text-night">Üçüncü taraflar</h2>
      <p>Verileriniz hizmet sağlayıcılarla yalnızca platformu çalıştırmak için paylaşılır: Supabase (kimlik doğrulama, veritabanı ve medya depolama), Stripe (Zigo Plus abonelik ödemeleri — kart bilgileri Stripe tarafında saklanır) ve kayıt sırasında kötüye kullanımı önlemek için Google reCAPTCHA. Bu taraflara veri satışı yapılmaz.</p>

      <h2 className="pt-2 text-base font-black text-night">Güvenlik ve saklama</h2>
      <p>İletişim TLS ile şifrelenir. Oturum çerezleri kimlik doğrulama için kullanılır; çerez tercihi cihazınızda yerel olarak saklanır. Hesap silme talebi alındığında veriler makul süre içinde silinir veya anonimleştirilir. Güvenlik ihlali şüphesinde kvkk@zigo.app adresine yazın.</p>
    </LegalLayout>
  );
}
