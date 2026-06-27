import type { RoleQaRole, RoleQaSection } from "@/lib/domain/role-qa-checklist";

export const roleQaContentTr: Record<RoleQaRole, RoleQaSection[]> = {
  student: [
    {
      title: "Hesap ve akış",
      items: [
        { id: "student-register", text: "/auth'tan kayıt ol ve en az bir eğitim alanıyla /onboarding'i tamamla.", href: "/auth" },
        { id: "student-feed", text: "Ana akış yalnızca seçili alanlardaki gönderi ve hikayeleri gösterir.", href: "/" },
        { id: "student-follow", text: "Akış, Dersler veya Keşfet'ten doğrulanmış öğretmenleri takip et.", href: "/explore?format=teachers" },
        { id: "student-engage", text: "Eşleşen gönderilerde beğen, kaydet ve yorum yap; yorumlar gösterilmeden moderasyondan geçer.", href: "/" },
        { id: "student-collections", text: "Kaydedilen gönderiler /collections Akıllı Koleksiyonlar'da görünür.", href: "/collections" },
      ],
    },
    {
      title: "Öğrenme ve güvenlik",
      items: [
        { id: "student-micro", text: "Kısa ders izle; puan yalnızca 60 saniyelik eşikten sonra alınabilsin.", href: "/micro" },
        { id: "student-quiz", text: "Mini quiz tamamla; doğru/inceleme açıklamalarını gör.", href: "/learn" },
        { id: "student-duels", text: "DM olmadan güvenli konu düelloları oyna.", href: "/duels" },
        { id: "student-progress", text: "Seri, lig ve seviye ilerlemesini /student'ta gör.", href: "/student" },
        { id: "student-no-dm", text: "Öğrenci doğrudan mesajlaşmasının hiçbir yerde olmadığını doğrula." },
      ],
    },
  ],
  parent: [
    {
      title: "Hesap ve denetim",
      items: [
        { id: "parent-register", text: "/auth'tan kayıt ol; paylaşılan eğitim alanıyla /onboarding tamamla.", href: "/auth" },
        { id: "parent-feed", text: "Veli akışı yalnızca seçili alanlarla eşleşir.", href: "/" },
        { id: "parent-family", text: "/family'den bağlı öğrenci profili oluştur.", href: "/family" },
        { id: "parent-areas", text: "Aile kurulumundan öğrenci ilgi alanlarını ata.", href: "/family" },
        { id: "parent-questions", text: "Seçili alanlarda soru sor; öğretmen yanıtlarını oku.", href: "/questions" },
      ],
    },
    {
      title: "Ödüller ve onaylar",
      items: [
        { id: "parent-rewards", text: "Ödül mağazası ve veli onay rehberini incele.", href: "/rewards" },
        { id: "parent-approve", text: "Öğrenme eylemlerini yalnızca veli kontrollü ekranlardan onayla.", href: "/parent" },
        { id: "parent-analytics", text: "Veli paneli sakin ve analitik odaklı kalsın.", href: "/parent" },
      ],
    },
  ],
  teacher: [
    {
      title: "Doğrulama ve alanlar",
      items: [
        { id: "teacher-register", text: "/auth'tan öğretmen olarak kayıt ol.", href: "/auth" },
        { id: "teacher-pending", text: "Platform onayı gelene kadar öğretmen doğrulanmamış kalsın.", href: "/teacher" },
        { id: "teacher-areas", text: "Doğrulama sonrası atanan eğitim alanları yayını açsın.", href: "/onboarding" },
        { id: "teacher-self-assign", text: "/api/interests öğretmen kendi alan atamasında 403 dönsün." },
      ],
    },
    {
      title: "Üretici yüzeyleri",
      items: [
        { id: "teacher-post", text: "Atanan alanda /create'ten gönderi oluştur.", href: "/create" },
        { id: "teacher-reel", text: "/create?mode=micro ile kısa ders oluştur.", href: "/create?mode=micro" },
        { id: "teacher-story", text: "Atanan alanda /create?mode=spark ile hikaye oluştur.", href: "/create?mode=spark" },
        { id: "teacher-answer", text: "Yalnızca atanan alanlardaki soruları cevapla.", href: "/questions" },
        { id: "teacher-profile", text: "Herkese açık profil ızgarası gönderi ve kısa dersleri göstersin.", href: "/profile" },
      ],
    },
  ],
  admin: [
    {
      title: "Platform kontrolü",
      items: [
        { id: "admin-bootstrap", text: "platform_admins'te ilk admin kaydı olsun.", href: "/setup" },
        { id: "admin-verify", text: "/admin'den öğretmen durumunu doğrula veya kaldır.", href: "/admin" },
        { id: "admin-areas", text: "/admin'den öğretmen eğitim alanlarını ata.", href: "/admin" },
        { id: "admin-rewards", text: "Ödül durumu ve stok yönet.", href: "/admin" },
      ],
    },
    {
      title: "Güvenlik ve moderasyon",
      items: [
        { id: "admin-reports", text: "Raporlar /moderation ve detay sayfalarında görünsün.", href: "/moderation" },
        { id: "admin-queue", text: "Moderasyon kuyrukları yorum, hikaye yanıtı ve raporları ayırsın.", href: "/moderation" },
        { id: "admin-audit", text: "Onay/red eylemleri moderation_audit_log satırı oluştursun.", href: "/moderation" },
        { id: "admin-rate-limit", text: "Yorum ve hikaye yanıtı spam denemeleri rate-limit geri bildirimi versin." },
      ],
    },
  ],
};
