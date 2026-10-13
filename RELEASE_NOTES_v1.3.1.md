# Zigo Android Sürüm Notları — v1.3.1 (Build 31)

**Yayın Tarihi:** 24 Eylül 2026  
**Paket Adı:** `com.zigo.education`  
**Sürüm:** `1.3.1` (VersionCode: `31`)  
**AAB Dosyası:**  
- `android/app/build/outputs/bundle/release/app-release.aab` (veya `Zigo-release-31.aab`)

---

## 🇹🇷 Google Play Console Sürüm Notu (Türkçe - tr-TR)

```text
Zigo 1.3.1 ile Google Play gizlilik ve güvenlik politikaları tam uyumlu hale getirildi!

Yenilikler & İyileştirmeler:
• 🔒 Gizlilik Odaklı Medya Deneyimi: Geniş depolama izinleri (READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_EXTERNAL_STORAGE) kaldırılarak Google Play fotoğraf ve medya seçim politikalarıyla %100 uyum sağlandı.
• 📸 Güvenli Fotoğraf Seçici: Profil fotoğrafı ve görsel ekleme akışları modern ve sıfır izin gerektiren sistem medya seçicisiyle güncellendi.
• 🗓️ Ajanda & Hatırlatıcılar: Tüm kullanıcılar için ajanda planlama, zaman ayarlı canlı sınav ve ödev hatırlatıcıları aktifleştirildi.
• ⚡ Kararlılık ve Performans: Akış optimizasyonları ve genel hata gidermeleri tamamlandı.
```

---

## 🇬🇧 Google Play Console Release Notes (English - en-US)

```text
Zigo 1.3.1 brings full compliance with Google Play's latest privacy and media policies!

What's New:
• 🔒 Privacy-First Media: Broad storage and media permissions (READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_EXTERNAL_STORAGE) have been completely removed in strict adherence to Google Play policies.
• 📸 Secure Photo Picker: Media uploads and profile picture selections now use the zero-permission system photo picker.
• 🗓️ Timed Agenda Reminders: Real-time exam and assignment reminders enabled across all user roles.
• ⚡ Stability & Enhancements: Performance improvements and under-the-hood polish.
```

---

## 🛠️ Teknik Değişiklikler (Changelog)

### 1. Google Play Politika Uyumlaştırması (Photo & Video Permissions Policy)
- `AndroidManifest.xml` içerisinden `android.permission.READ_MEDIA_IMAGES`, `android.permission.READ_MEDIA_VIDEO` ve `android.permission.READ_EXTERNAL_STORAGE` izinleri kaldırıldı.
- Üçüncü parti kütüphanelerin bu izinleri dolaylı olarak eklemesini engellemek için `tools:node="remove"` kuralları tanımlandı.
- Fotoğraf ve medya seçimi Android'in sıfır izin (zero-permission) gerektiren yerel seçicisi üzerinden yürütülecek biçimde doğrulandı.

### 2. Sürüm Yapılandırması
- `android/app/build.gradle`: `versionCode 31`, `versionName "1.3.1"` olarak güncellendi.
