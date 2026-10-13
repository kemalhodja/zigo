# Zigo Android Sürüm Notları — v1.3.0 (Build 30)

**Yayın Tarihi:** 24 Eylül 2026  
**Paket Adı:** `com.zigo.education`  
**Sürüm:** `1.3.0` (VersionCode: `30`)  
**AAB Dosyası:**  
- `android/app/build/outputs/bundle/release/app-release.aab` (veya `Zigo-release-30.aab`)

---

## 🇹🇷 Google Play Console Sürüm Notu (Türkçe - tr-TR)

```text
Zigo 1.3.0 ile Ajanda, Sınav ve Ödev Takibi baştan aşağı yenilendi!

Yenilikler & İyileştirmeler:
• 🗓️ Herkes İçin Ajanda: Ajanda modülü artık öğretmen, veli, kurum ve tüm rollere açıldı. Sınavlarınızı ve ödevlerinizi kolayca planlayın.
• ⏰ Canlı Hatırlatıcılar: Sınav ve ödevlerinize istediğiniz dakikada hatırlatıcı kurun; vakti geldiğinde ana sayfada akıllı bildirim kartı otomatik olarak karşınıza çıksın.
• 📚 Kişiselleştirilmiş Ders Programı: Ders programı modülü odaklanmayı artırmak için sadece öğrenci ve velilere özel hale getirildi; eski veriler sıfırlandı.
• 🧹 Temiz Akış & Yüksek Performans: Tüm gönderi ve reklam kalıntıları temizlendi, anasayfa akışı ve profil performansı optimize edildi.
```

---

## 🇬🇧 Google Play Console Release Notes (English - en-US)

```text
Zigo 1.3.0 brings a completely revamped Agenda, Exam, and Assignment Tracking experience!

What's New:
• 🗓️ Agenda for Everyone: The Agenda is now accessible to teachers, parents, institutions, and all roles. Organize exams and homework effortlessly.
• ⏰ Smart Timed Reminders: Set reminders for upcoming exams and deadlines. When the time comes, an interactive reminder banner appears directly on your home feed.
• 📚 Focused Class Schedules: Class schedule tracking is now tailored exclusively for students and parents; previous demo schedules have been reset.
• 🧹 Streamlined Performance: Feed and profile data optimized for peak responsiveness.
```

---

## 🛠️ Teknik & Yönetim Değişiklikleri (Changelog)

### 1. Yeni Özellikler & Fonksiyonel İyileştirmeler
- **Agenda Modülü & Rol Kısıtlamaları:**
  - `ScheduleLesson` (Ders Programı) sekmesi yalnızca `student` ve `parent` rollerine gösterilecek şekilde izole edildi.
  - Diğer tüm roller (`teacher`, `education_institution`, `education_platform`, `publisher`) için Ajanda sekmesinde Sınavlar ve Ödevler tam işlevli olarak sunuldu.
- **Hatırlatıcı Motoru (`reminderMinutes`):**
  - Sınav ve ödev şemalarına `reminderMinutes` eklendi (15 dk, 30 dk, 1 saat, 2 saat, 1 gün).
  - Anasayfa akışına (`HomeAgendaAlert`) canlı hatırlatıcı kutucukları, kapatma/ertelemeli sayaç mekanizması ve haptic titreşim eklendi.
- **Veri Sıfırlama:**
  - Eski ders programı mock verileri sıfırlandı ve storage versiyonu `zigo_agenda_data_v2` olarak güncellendi.
  - Supabase üzerindeki eski test gönderileri, istatistikler ve reklamlar temizlendi.

### 2. Sürüm Yapılandırması
- `android/app/build.gradle`: `versionCode 30`, `versionName "1.3.0"` olarak tanımlandı.
- `bundleRelease` derleme süreci başlatıldı.
