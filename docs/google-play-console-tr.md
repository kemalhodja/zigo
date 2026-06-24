# Google Play Console — kopyala-yapıştır (TR)

Production domain: **https://zigo.app**  
Paket adı: **com.zigo.education**

Detaylı Data safety eşlemesi: `docs/google-play-data-safety.md`

---

## Gizlilik politikası URL

```
https://zigo.app/legal/privacy
```

Koşullar (isteğe bağlı alan):

```
https://zigo.app/legal/terms
```

---

## Mağaza listesi

**Uygulama adı:** Zigo  
**Kısa açıklama (80 karakter):**

```
Doğrulanmış öğretmen içerikleri, veli denetimi ve oyunlaştırılmış güvenli eğitim akışı.
```

**Tam açıklama (özet):**

```
Zigo, doğrulanmış öğretmenlerin eğitim alanlarında paylaştığı içeriklerle çalışan mobil eğitim platformudur.

• Öğretmenler: yalnızca atanmış alanlarda doğrulanmış içerik yayınlar
• Veliler: çocuk ilerlemesini, ödül onaylarını ve odak analitiğini denetler
• Öğrenciler: micro dersler, quizler, düellolar — öğrenciler arası DM yok
• Güvenlik: moderasyon, küfür/+18/zorbalık filtreleri, bildirim sistemi
• Zigo Plus: isteğe bağlı abonelik (Stripe)

Gizlilik: https://zigo.app/legal/privacy
KVKK: https://zigo.app/legal/kvkk
```

**Kategori:** Eğitim  
**E-posta:** privacy@zigo.app (veya destek adresiniz)

---

## App content — hızlı cevaplar

| Soru | Cevap |
| --- | --- |
| Gizlilik politikası | Evet → `https://zigo.app/legal/privacy` |
| Reklam | **Evet** — etiketli sponsorlu eğitim gönderileri; üçüncü taraf reklam SDK yok |
| Uygulama erişimi | Giriş gerekli — aşağıdaki test hesaplarını inceleme notuna ekleyin |
| Hedef kitle | **Çocuklar dahil** — Families Policy anketi doldurulmalı |
| Veri güvenliği | Aşağıdaki § Data safety |
| Uygulama içi satın alma | Evet — Zigo Plus (Stripe abonelik) |

---

## Data safety — üst özet

| | |
| --- | --- |
| Veri topluyor mu? | **Evet** |
| Veri paylaşıyor mu? | **Evet** (yalnızca altyapı/ödeme/güvenlik sağlayıcıları) |
| Veri satıyor mu? | **Hayır** |
| Aktarımda şifreleme | **Evet** |
| Silme talebi | **Evet** — uygulama içi `/legal/delete-account` |

---

## Data safety — veri türleri (Play’de işaretle)

Her satır için genelde: **Toplanıyor = Evet**, **Paylaşılıyor = Evet** (işlemci), **Zorunlu = çoğu Evet**, **Geçici = Hayır**.

### Kişisel bilgiler

| Tür | Amaç |
| --- | --- |
| E-posta | Hesap yönetimi, geliştirici iletişimi |
| Ad | Hesap yönetimi, uygulama işlevi |
| Kullanıcı kimlikleri | Hesap yönetimi, uygulama işlevi |
| Diğer bilgiler | Rol (öğretmen/veli/öğrenci), doğrulama durumu |

### Finansal bilgiler

| Tür | Amaç |
| --- | --- |
| Satın alma geçmişi | Uygulama işlevi (Zigo Plus — Stripe) |

### Uygulama etkinliği

| Tür | Amaç |
| --- | --- |
| Uygulama etkileşimleri | Uygulama işlevi (quiz, video, puan, düello) |
| Diğer kullanıcı tarafından oluşturulan içerik | Uygulama işlevi, güvenlik (moderasyon) |
| Diğer eylemler | Ödül onayları, bildirimler |

### Dosyalar

| Tür | Amaç |
| --- | --- |
| Fotoğraflar ve videolar | Eğitim içeriği (öğretmen medyası); isteğe bağlı öğrenci belgesi |

### Uygulama bilgisi (isteğe bağlı)

| Tür | Amaç |
| --- | --- |
| Çökme günlükleri | Yalnızca Sentry etkinse |
| Teşhis | Hosting logları |

**Cihaz kimliği:** Hayır (reklam SDK yok). Kayıtta reCAPTCHA kullanılıyorsa Google güvenlik uygulamalarında belirtin.

---

## Paylaşılan üçüncü taraflar

Play Console’da “veri paylaşılıyor” dediğinizde bunları kasteder:

1. **Supabase** — auth, veritabanı, medya  
2. **Stripe** — abonelik ödemeleri  
3. **Google reCAPTCHA** — kayıt güvenliği (etkinse)  
4. **Hosting (Vercel vb.)** — HTTPS sunumu  

---

## Families / çocuk politikası

Play Console → **Hedef kitle**:

- Uygulama **çocuklara yönelik** veya **aileler için** olarak işaretlenmeli  
- **Behavioral reklam yok** — reklam SDK yok  
- Veli denetimi: çocuk profili, ödül onayı  
- Öğrenci DM yok  
- UGC moderasyonu var  

---

## İçerik derecelendirme (IARC)

Beklenen işaretler:

- Kullanıcı etkileşimi: **Evet** (yorum, soru)  
- Bilgi paylaşımı: **Evet** (moderasyonlu UGC)  
- Konum: **Hayır**  
- Uygulama içi satın alma: **Evet** (Zigo Plus)  
- Şiddet/cinsellik: **Düşük** (eğitim platformu; +18 filtre aktif)

---

## İnceleme notu — test hesapları (örnek)

Play Console → **App access** → “Tüm işlevler kısıtlı” ise:

```
Öğretmen test:
E-posta: [TEST_TEACHER_EMAIL]
Şifre: [TEST_PASSWORD]
Not: is_verified=true, en az bir eğitim alanı atanmış olmalı.

Veli test:
E-posta: [TEST_PARENT_EMAIL]
Şifre: [TEST_PASSWORD]

Öğrenci test:
E-posta: [TEST_STUDENT_EMAIL]
Şifre: [TEST_PASSWORD]
Not: Öğrenci belgesi onaylı hesap kullanın.

Gizlilik: https://zigo.app/legal/privacy
Mobil uygulama Capacitor WebView ile https://zigo.app adresini yükler.
```

Seed kullanıcıları (yerel): `docs/seed-users.md` veya migration seed e-postaları.

---

## Supabase Auth redirect (production)

Supabase Dashboard → Authentication → URL configuration:

```
https://zigo.app/auth/callback
https://zigo.app/auth/callback?next=/onboarding
```

Site URL:

```
https://zigo.app
```

---

## AAB build (production URL ile)

```powershell
$env:CAPACITOR_SERVER_URL="https://zigo.app"
npm.cmd run android:build:release
```

Çıktı: `Zigo-release.aab`
