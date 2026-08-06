# Zigo Core Business Logic & Engineering Rules

## 1. Business Model & Subscription (SaaS) Engine
- **No Ads Policy**: Uygulamada reklam (AdMob vb.) KESİNLİKLE YOKTUR.
- **30-Day Full Trial**: Kullanıcılar kayıt olduktan sonra ilk 30 gün boyunca tam özellikli ücretsiz deneme (Trial) hakkına sahiptir.
- **Dynamic Pricing Engine**:
  - Kayıttan sonraki **ilk 30 gün içinde** abone olan kullanıcılara **%50 indirimli** dinamik fiyat uygulanır.
  - **30 günden sonra** abone olan kullanıcılara ise indirim uygulanmaz (**%0 / Standart Tam Liste Fiyatı** uygulanır).
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
- **Daily Post Limit**: Standart kullanıcılar günde maksimum 5 gönderi paylaşabilir (`MAX_DAILY_POSTS = 5`).
- **Video & Reels Limits**:
  - Maksimum dosya boyutu: **100 MB**.
  - Maksimum video süresi: **60-90 saniye**.
  - 100 MB üzerindeki videolar yüklenmeden önce istemci tarafında (client-side) mutlaka sıkıştırılmalıdır.

## 4. Coding & Output Standard
- Asla tüm projeyi veya gereksiz dosyaları yeniden yazma.
- Yalnızca değişmesi gereken ilgili dosya ve fonksiyonu tam, hatasız ve eksiksiz ver.
- Asla taslak/geçici yorum kodlar (`// ...`, `// TODO`) bırakma.
