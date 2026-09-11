# Zigo Android Sürüm Notları — v1.2.5 (Build 25)

**Yayın Tarihi:** 11 Eylül 2026  
**Paket Adı:** `com.zigo.education`  
**Sürüm:** `1.2.5` (VersionCode: `25`)  
**AAB Dosyaları:**  
- `Zigo-release.aab` (8.84 MB)  
- `Zigo-YENI-release.aab` (8.84 MB)  

---

## 🇹🇷 Google Play Console Sürüm Notu (Türkçe - tr-TR)

```text
Zigo 1.2.5 ile öğrenme deneyimini ve platform güvenliğini bir üst seviyeye taşıdık!

Yenilikler & İyileştirmeler:
• 🎮 Oyun Salonu Denetimi: Öğrencilerimizin zihinsel gelişimi için günlük 2 saatlik oyun süresi ve 22:00-08:00 gece dinlenme kuralı tam uyumlu hale getirildi.
• 🔔 Akıllı Bildirimler: İlgi alanlarınıza ve derslerinize özel anlık hatırlatmalar ve bildirim sistemi.
• 🛡️ Güvenli Topluluk & AI Moderasyon: Yapay zeka destekli içerik tarama ile çocuklarımız ve öğrencilerimiz için %100 güvenli, reklamsız eğitim ortamı.
• 💳 Abonelik & Havale İyileştirmeleri: Zigo Plus abonelik onayları ve havale/EFT süreçlerinde hızlandırma ve anında aktivasyon.
• ⚡ Performans & Kararlılık: Reels ve mikro ders yükleme süreleri optimize edildi, sayfa geçişleri hızlandırıldı.
```

---

## 🇬🇧 Google Play Console Release Notes (English - en-US)

```text
Zigo 1.2.5 brings exciting new learning enhancements and safety features!

What's New:
• 🎮 Game Room Enhancements: Daily 2-hour learning game limits and 10 PM - 8 AM curfew for healthy digital balance.
• 🔔 Smart Notifications: Stay up to date with customized alerts for upcoming study sessions and educational milestones.
• 🛡️ AI Moderation & Student Safety: Upgraded content safety engine ensuring an ad-free, secure learning atmosphere.
• 💳 Instant Plus Activation: Faster processing for Zigo Plus subscriptions and bank transfer verification.
• ⚡ Speed & Stability: Improved video playback responsiveness and smooth screen transitions.
```

---

## 🛠️ Teknik & Yönetim Değişiklikleri (Changelog)

### 1. 5 Yeni Admin Süper Modülü
- **🔔 Bildirim Merkezi (`AdminNotificationCenter`):** Rol ve abonelik bazlı hedef kitle segmentasyonu, hazır şablonlar, anında ve zamanlanmış gönderim.
- **📊 Gelişmiş Analytics (`AdminAnalyticsDashboard`):** 30 günlük kayıt trendi (AreaChart), platform sağlık skoru (0-100), rol dağılımı pasta grafiği ve gelir kırılımı.
- **💳 Ödeme & Abonelik Yönetimi (`AdminBillingDashboard`):** MRR/ARR metrikleri, aktif abonelikler, son churn listesi ve Stripe/Havale filtreleri.
- **🎮 Oyun Salonu Monitörü (`AdminGameMonitor`):** Gece yasağı (22:00 - 08:00) ihlal tespiti, 120 dk limit aşımı göstergeleri, XP farm kontrolü ve canlı oturumlar.
- **📚 İçerik Moderasyon Kuyruğu (`AdminContentModerationQueue`):** KRİTİK/Yüksek öncelik sıralaması, AI bayrakları, toplu onay/gizle/sil işlemleri.

### 2. Kullanıcı 360 Görünümü & Raporlama
- Her kullanıcı için detaylı profil ekranı (`/admin/users/[id]`).
- Resmi öğrenci karne ve gelişim çıktısı (PDF/yazdırılabilir format).
- Yönetici iç notları, manuel Zigo Plus tanımlama ve deneme süresi sıfırlama.

### 3. Altyapı & Derleme Düzeltmeleri
- `next.config.ts` üretim paket çözümlemesi (`@next/bundle-analyzer`) koruma altına alındı.
- `database.types.ts` ve Supabase sorguları tam tip güvenliğine kavuşturuldu.
- `android/app/build.gradle`: `versionCode 25`, `versionName "1.2.5"` güncellendi.
