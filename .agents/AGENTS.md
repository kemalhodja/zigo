# Zigo Core Business Logic & Engineering Rules

## 1. Business Model & Subscription (SaaS) Engine
- **No Ads Policy**: Uygulamada reklam (AdMob vb.) KESİNLİKLE YOKTUR.
- **7-Day Full Trial**: Kullanıcılar kayıt olduktan sonra ilk 7 gün boyunca tam özellikli ücretsiz deneme (Trial) hakkına sahiptir.
- **Dynamic Pricing Engine**:
  - Kayıttan sonraki **ilk 7 gün içinde** abone olan kullanıcılara **%50 indirimli** dinamik fiyat uygulanır (Promo kodu: ZIGO50).
  - **7 günden sonra** abone olan kullanıcılara indirim uygulanmaz (**%0 / Standart Tam Liste Fiyatı** uygulanır).
  - Fiyatlandırma motoru (`subscription-campaign.ts` / `subscription-plans.ts`) her zaman bu dinamik hesaba göre çalışmalıdır.

## 2. Roles & Authorization (RBAC)
Sistemde 6 temel rol bulunur. Her ekran ve rota (Route Guards) kullanıcının rolüne göre doğrulanmalıdır:
- **STUDENT** (Öğrenci)
- **TEACHER** (Öğretmen)
- **PARENT** (Veli)
- **EDUCATION_INSTITUTION** (Eğitim Kurumu: Kurum yönetimi, toplu kullanıcı takibi ve kurumsal paylaşım)
- **EDUCATION_PLATFORM** (Eğitim Platformu: Dijital kurs ve müfredat içerikleri sunma)
- **PUBLISHER** (Yayınevi: Soru bankası, kaynak ve dijital yayın paylaşımları)

## 3. Data & Content Limits (Rate Limiting & Storage)
- **Daily Post Limit**:
  - Öğretmen, kurum ve platformlar: Günde maksimum 5 gönderi (`MAX_DAILY_POSTS = 5`).
  - **Öğrenci & Veli (Zigo Plus)**: Günde maksimum 2 gönderi (`MAX_DAILY_POSTS = 2`).
  - **Gizlilik Kuralı**: Öğrenci ve veli gönderileri Keşfet'e (`/explore`) ASLA düşmez; yalnızca karşılıklı takipleşen kullanıcıların ana sayfa akışında (`/`) görünür.
- **Video & Reels Limits**:
  - Maksimum dosya boyutu: **100 MB**.
  - Maksimum video süresi: **60-90 saniye**.
  - 100 MB üzerindeki videolar yüklenmeden önce istemci tarafında (client-side) mutlaka sıkıştırılmalıdır.

## 4. Coding & Output Standard
- Asla tüm projeyi veya gereksiz dosyaları yeniden yazma.
- Yalnızca değişmesi gereken ilgili dosya ve fonksiyonu tam, hatasız ve eksiksiz ver.
- Asla taslak/geçici yorum kodlar (`// ...`, `// TODO`) bırakma.

## 5. Senior Product & Polish Standard (Apple & NYT Games Seviyesi)
- **İlk Seferde Kusursuz Yap:** Sadece "çalışan MVP" kod yazıp bırakma; ilk seferde dünya standartlarında bir ürün kalitesiyle teslim et.
- **State Persistence (Kaybolmayan İlerleme):** Kullanıcının vakit harcadığı tüm formlar, bulmacalar, oyunlar ve kritik ekranlar `localStorage` veya veritabanı ile korunmalıdır (sayfa yenilenince veya sekme arka plana düşünce veri/oyun asla sıfırlanmamalıdır).
- **Undo / Resilience (Hata Toleransı):** Kullanıcının yanlış tıklama/hamle yapabileceği her ekranda `Geri Al (Undo)` ve `Temizle` gibi kullanıcı dostu güvenlik mekanizmaları standart olmalıdır.
- **Haptic & Mikro-Etkileşim:** Mobilde kritik tıklama, başarı veya hata anlarında `navigator.vibrate` ile haptic geri bildirim ve pürüzsüz animasyonlar ilk seferde dahil edilmelidir.
- **Gerçekçi Veri & Filtreleme:** Kullanıcıya sunulan veriler (kelimeler, test soruları, listeler) ham bırakılmamalı; eskimiş, alakasız veya kullanıcıyı soğutacak nadir/çöp veriler filtrelenmiş olmalıdır.
