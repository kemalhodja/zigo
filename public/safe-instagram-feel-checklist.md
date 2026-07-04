# Zigo Güvenli Instagram-Hissi Checklist

Bu liste, Zigo'nun modern sosyal feed hissi vermesini sağlarken Instagram markasını taklit etmemek için kullanılır.

**Not:** Bu bir hukuki tavsiye değildir. Ticari yayın öncesi fikri mülkiyet avukatına danışın.

## 1. Genel kural

| Durum | Açıklama |
| --- | --- |
| Güvenli | Sektörde yaygın sosyal UX kalıpları (feed, Spark, Micro, profil grid, alt nav) |
| Riskli | Instagram adı, logosu, renk sistemi, ikon seti ve ekran düzeninin birebir kopyası |
| Hedef | "Instagram gibi" değil → **"modern, mobil, sosyal eğitim feed'i"** |

## 2. Marka ve dil (ASLA kopyalama)

- [ ] Uygulama adı her yerde **Zigo**; "Instagram", "Insta", "IG" geçmez.
- [ ] Logo, wordmark ve app icon **Zigo'ya özgü** (Meta/Instagram gradient kamerası yok).
- [ ] Store açıklamasında "Instagram clone", "Instagram benzeri uygulama" yazılmaz.
- [ ] Pazarlama metni: "verified education social feed", "modern mobile learning feed".
- [ ] Instagram'ın tescilli sloganı, hashtag kampanyası veya marka dili kopyalanmaz.

## 3. Görsel kimlik (Zigo farklı kalsın)

| Öğe | Güvenli | Değiştir / kaçın |
| --- | --- | --- |
| Renk paleti | Zigo night/crystal/berry sistemi | Instagram mor-pembe-kamera gradient birebir |
| Tipografi | Sistem sans, Zigo wordmark | Instagram'a özgü font hissi |
| İkonlar | Basit line ikonlar, kendi set | Instagram ikonlarının piksel kopyası |
| Story halkası | Renkli gradient ring (genel pattern) | Aynı kalınlık, aynı renk sırası, aynı animasyon |
| Bottom nav | 5 ikonlu mobil nav (standart) | Aynı sıra + aynı aktif state + aynı ikon şekilleri |
| Boşluk / radius | Mobil-first, yuvarlak köşeler | Ekran ekran Instagram layout kopyası |

## 4. Ekran ekran güvenli kalıplar

### Home
- [ ] Story tray + For You / Following sekmeleri → **kalabilir** (yaygın pattern).
- [ ] Post kartı: avatar, medya, like/comment/save → **kalabilir**.
- [ ] Üst bar Zigo wordmark ile → **Zigo markası görünür**.
- [ ] Eğitim özellikleri ikincil rozet/aksiyon seviyesinde → **farklılaşma**.

### Micro
- [ ] Dikey tam ekran video + sağ action rail → **kalabilir**.
- [ ] Alt creator caption alanı → **kalabilir**.
- [ ] "+10 after watch" gibi eğitim rozetleri → **Zigo'ya özgü fark**.
- [ ] "Original audio" yerine nötr sosyal dil kullan.

### Profile
- [ ] Avatar + istatistik + grid → **kalabilir**.
- [ ] Highlights, posts/micro/saved sekmeleri → **kalabilir**.
- [ ] "Verified creator" rozeti → eğitim doğrulaması bağlamında, Instagram blue tick kopyası değil.

### Explore / Create
- [ ] Arama + masonry/grid keşif → **kalabilir**.
- [ ] Creator composer (post/Micro/Spark) → **kalabilir**.
- [ ] Alan seçimi ve Match-Feed → **Zigo'ya özgü**.

## 5. Metin ve UX dili

- [ ] "Smart Collections" yerine görünürde **Saved** / **Private grid**.
- [ ] "Lesson" yerine görünürde **post** / **Micro** (eğitim sr-only veya ikincil).
- [ ] "Dashboard" dili ana ekranda yok; sosyal dil önde.
- [ ] Hata/boş durum metinleri Zigo tonunda, Instagram cümleleri değil.

## 6. Teknik ve asset güvenliği

- [ ] Instagram CDN, logo, ikon, screenshot asset'i projede yok.
- [ ] `manifest.json`, `icon.svg`, PWA ikonları Zigo markalı.
- [ ] Demo placeholder medya telifsiz veya Zigo üretimi.
- [ ] Deep link / URL scheme `zigo://` veya kendi domain; `instagram://` yok.

## 7. Store ve pazarlama kontrolü

- [ ] App Store / Play Store başlığı: **Zigo – Verified Education Feed**.
- [ ] Screenshot'larda Instagram logosu veya arayüzü yok.
- [ ] Rakip karşılaştırma tablosunda "Instagram'ın aynısı" iddiası yok.
- [ ] Basın bülteni: "education-first social platform" vurgusu.

## 8. Hızlı QA (her release öncesi)

1. Ekran görüntüsünü Instagram ile yan yana koy: **yanlışlıkla aynı uygulama sanılır mı?**
2. Logo ve isim her ekranda **Zigo** mu?
3. Eğitim/güvenlik özellikleri görünürde baskın değil, ikincil mi?
4. Store metni ve uygulama içi dil marka taklidi içermiyor mu?

## 9. Zigo farklılaştırma özeti (bunu koru)

- Match-Feed ile alan bazlı içerik
- Öğretmen doğrulama + admin area ataması
- Öğrenci moderasyonu, DM yok
- Veli onayı, Kumbara Store, öğrenme puanları
- Rol bazlı profiller (öğrenci / veli / öğretmen)

Bu özellikler Zigo'yu "Instagram klonu" değil, **eğitim odaklı sosyal platform** yapar.

## 10. Release gate

Release öncesi sıra:

1. `safe-instagram-feel-checklist.md` (bu dosya)
2. `visual-regression-checklist.md`
3. `manual-qa-checklist.md`
4. `final-acceptance-checklist.md`
