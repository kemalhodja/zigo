# Zigo Android Sürüm Notları — v1.2.9 (Build 29)

**Yayın Tarihi:** 20 Eylül 2026  
**Paket Adı:** `com.zigo.education`  
**Sürüm:** `1.2.9` (VersionCode: `29`)  
**AAB Dosyası:**  
- `Zigo-release-29.aab` (veya app/build/outputs/bundle/release/app-release.aab)

---

## 🇹🇷 Google Play Console Sürüm Notu (Türkçe - tr-TR)

```text
Zigo 1.2.9 ile oyun, sosyal akış ve özel ders deneyimini daha da iyileştirdik!

Yenilikler & İyileştirmeler:
• 🎮 Oyun İlerlemesi & Kelime Oyunları: Oyun salonundaki ilerlemeleriniz artık daha senkronize ve güvenilir şekilde kaydediliyor. Kelime oyunlarında geliştirmeler yapıldı.
• 📱 Sosyal Akış (Gönderiler): Gönderi (post) akışındaki veri alışverişi hızlandırıldı, daha pürüzsüz bir sosyal etkileşim sağlandı.
• 👨‍🏫 Özel Ders Talepleri: Özel ders talepleri ekranlarında altyapı güncellemeleri yapıldı, öğretmen ve öğrenci arasındaki iletişim daha kararlı hale getirildi.
• 🛠️ Hata Giderme: Veritabanı tipleri (database types) senkronize edildi ve altyapısal iyileştirmeler uygulandı.
```

---

## 🇬🇧 Google Play Console Release Notes (English - en-US)

```text
Zigo 1.2.9 enhances your gaming, social feed, and lesson request experience!

What's New:
• 🎮 Game Progress & Word Games: Your game progress in the arcade is now saved more reliably and synchronized seamlessly. Enhancements made to word games.
• 📱 Social Feed (Posts): Improved data handling in the social feed for a smoother scrolling and interaction experience.
• 👨‍🏫 Lesson Requests: Infrastructure updates to the lesson request flows, ensuring more stable communication between teachers and students.
• 🛠️ Bug Fixes: Database types have been synchronized along with various under-the-hood stability improvements.
```

---

## 🛠️ Teknik & Yönetim Değişiklikleri (Changelog)

### 1. Yeni Özellikler (Features)
- **Oyun Motoru:** `games/progress` ve `games/word` API uç noktalarında veri tutarlılığı sağlandı.
- **Sosyal Akış:** `social/posts` API tarafında iyileştirmeler.
- **Ders Talepleri:** `lesson-requests/[id]` detaylı veri akışı güncellemeleri.

### 2. Performans İyileştirmeleri (Performance)
- Veritabanı (`database.types.ts`) şema tipleri Supabase ile tam uyumlu hale getirildi, tip güvenliği (type safety) artırıldı.
- API rotalarında (route) daha hızlı yanıt süreleri için optimizasyonlar.

### 3. Hata Gidermeleri ve Bakım (Fixes & Chores)
- `android/app/build.gradle`: `versionCode 29`, `versionName "1.2.9"` olarak güncellendi.
- AAB paketi başarıyla derlendi.
