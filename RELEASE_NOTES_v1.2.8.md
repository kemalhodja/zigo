# Zigo Android Sürüm Notları — v1.2.8 (Build 28)

**Yayın Tarihi:** 18 Eylül 2026  
**Paket Adı:** `com.zigo.education`  
**Sürüm:** `1.2.8` (VersionCode: `28`)  
**AAB Dosyası:**  
- `Zigo-release-28.aab`

---

## 🇹🇷 Google Play Console Sürüm Notu (Türkçe - tr-TR)

```text
Zigo 1.2.8 ile daha akıllı, daha hızlı ve daha düzenli bir eğitim deneyimine hazır olun!

Yenilikler & İyileştirmeler:
• 📅 Yeni Ajanda Yönetimi: Profilinize eklenen Ajanda sekmesiyle sınavlarınızı ve ödevlerinizi kolayca takip edin. Süresi dolan görevler artık otomatik temizleniyor.
• 📍 Gelişmiş Öğrenci Kaydı: Öğrencilerimiz için konum ve sınıf/kademe belirleme özelliklerini zorunlu hale getirerek daha kişiselleştirilmiş içerikler sunuyoruz.
• 📢 Sponsorlu Reklamlar & Havale Dönüşümü: Yenilenmiş Meta tarzı "Sponsorlu" etiketleri ve Havale/EFT destekli, dönüşümlü (round-robin) reklam gösterim altyapısı.
• ⚡ Mobil Performans: WebView önbellekleme, görsel optimizasyonlar ve sunucu taraflı önbellek geliştirmeleri ile uygulamanız artık çok daha akıcı.
• 🛠️ Hata Giderme: Veritabanı tipleri ve canlı önizleme hataları düzeltildi, uygulama kararlılığı artırıldı.
```

---

## 🇬🇧 Google Play Console Release Notes (English - en-US)

```text
Zigo 1.2.8 brings a smarter, faster, and more organized learning experience!

What's New:
• 📅 New Agenda Manager: Keep track of your exams and homeworks easily with the new Agenda tab on your profile. Expired tasks are now automatically cleaned up.
• 📍 Advanced Learner Onboarding: We've introduced mandatory location and grade registration to serve more personalized educational content.
• 📢 Sponsored Ads & EFT Integration: Revamped Meta-style sponsored CTAs and round-robin ad rotation, now fully integrated with Bank Transfer/EFT payments.
• ⚡ Mobile Performance: Experience a much smoother app with enhanced WebView caching, image optimizations, and server-side cache boosts.
• 🛠️ Bug Fixes: Resolved database typing issues and live preview bugs, significantly improving overall app stability.
```

---

## 🛠️ Teknik & Yönetim Değişiklikleri (Changelog)

### 1. Yeni Özellikler (Features)
- **Ajanda Yöneticisi:** Öğrenci profillerine yeni ajanda sekmeleri eklendi; süresi geçen sınav ve ödevlerin otomatik olarak arşivlenmesi/temizlenmesi sağlandı.
- **Kayıt Sistemi:** Öğrenciler için konum ve kademe/sınıf bilgisi zorunlu hale getirilerek kişiselleştirilmiş akış iyileştirildi.
- **Reklam & Sponsorluk:** Reklam ödemeleri tamamen Havale/EFT altyapısına geçirildi. Sponsorlu içeriklerin (round-robin) dengeli rotasyonla gösterimi ve Meta tarzı CTA butonları eklendi. Sponsor banner ödemeleri aktif edildi.

### 2. Performans İyileştirmeleri (Performance)
- React cache ve sunucu taraflı önbellekleme sayesinde Hikaye (Story) ve İçerik Üreticisi (Creator) sorguları hızlandırıldı.
- Mobil WebView performansı için önbellekleme (caching) agresifleştirildi, görsel (image) dönüşümleri (transform) ve ana akış veri optimizasyonları yapıldı.

### 3. Hata Gidermeleri ve Bakım (Fixes & Chores)
- Canlı önizleme hataları, `enum` tipleri ve kampanya oluşturmadaki veritabanı kısıtlamaları (db constraints) onarıldı.
- Hedef URL yönlendirmelerinde (fallback) ve abonelik kapısında (subscription gate) yaşanan sorunlar giderildi.
- TS (TypeScript) yapılandırma ve ESlint uyarıları üretim (production) ortamı için tamamen çözüldü.
- `android/app/build.gradle`: `versionCode 28`, `versionName "1.2.8"` olarak güncellendi.
