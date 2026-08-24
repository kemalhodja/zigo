# Zigo Vizyon Yol Haritası

> Dört gözle (yazılımcı / tasarımcı / yaratıcı / araştırmacı) tanımlanan 13 maddenin
> uygulama planı. Her fazın çıkış kriteri vardır; faz tamamlanmadan sonrakine geçilmez.

## North-Star Metrik

**Öğrenci başına haftalık odaklanmış dakika** (weekly focused minutes).
DAU/puan gibi vanity metrikleri değil; her özellik bu metriği iyileştiriyorsa kalır.

- Veri kaynakları: `learning_events.pomodoro_completed` (25 dk/oturum), oyun süreleri
- Sunum: `/api/metrics/focus-week`, admin KPI paneli, veli özet grafiği

---

## Faz 0 — Ölçüm Temeli (bu hafta)

| # | Madde | Çıkış kriteri |
|---|-------|---------------|
| 11 | North-star metrik altyapısı | `get_weekly_focus_minutes` RPC + API canlı |
| 13 | Ürün analitiği | PostHog env-gated entegre; `signed_up`, `game_completed`, `checkout_started`, `pomodoro_completed` event'leri akıyor |

## Faz 1 — Çekirdek Döngü ("birlikte çalışma") (2–4 hafta)

| # | Madde | Çıkış kriteri |
|---|-------|---------------|
| 1 | Gerçek zamanlı odak odaları | Supabase Realtime presence; senkron Pomodoro sayacı; "şu an X kişi çalışıyor" göstergesi; rooms simülasyonu kaldırılır |
| 6 | Kayıt öncesi önizleme + ilk gün deneyimi | Feed anonim örnek akış gösterir; ilk oturum: ilk pomodoro → ilk puan → ilk avatar zinciri tasarlanmış |
| 5 | Masaüstü iki panelli düzen | ≥1024px'de sol feed / sağ odak sayacı; mobil düzen değişmez |

## Faz 2 — Büyüme Döngüleri (4–8 hafta)

| # | Madde | Çıkış kriteri |
|---|-------|---------------|
| 8 | Öğrenci quiz üretimi (UGC) | Quiz oluşturma → paylaşım linki → çözenlerin skoru; moderasyon hattına bağlı |
| 9 | Sınav sezonu mekanikleri | LGS/YKS geri sayımı + haftalık lig tablosu + sınıf turnuvası |
| 12 | Aralıklı tekrar motoru (SM-2) | Yanlış cevaplardan kart havuzu; "bugünün tekrarları" kartı; veli gelişim grafiği |

## Faz 3 — Zekâ ve Dayanıklılık (8+ hafta)

| # | Madde | Çıkış kriteri |
|---|-------|---------------|
| 10 | AI günlük çalışma planı | Yanlış verisinden gpt-4o-mini ile kişisel "bugünkü paket"; kabul ölçütü: plan takip edenlerde haftalık odak dakika artışı |
| 2 | Offline-first PWA | Feed + oyunlar çevrimdışı açılır; optimistic UI |
| 4 | Feature flag katmanı | Tüm kapılar tek modülden; lansman günü anlık aç/kapa |
| 7 | Görsel kimlik | Emoji yerine 8–10 parçalık özel illüstrasyon seti; App Store varlık paketi |
| 3 | Tek doğruluk kaynağı | Prisma silinir; migration isimleri sıralı; audit script'leri CI-native gate'lere taşınır |

## Ölçüm Disiplini (tüm fazlar için)

- Her yeni özellik PostHog funnel'ı ile birlikte çıkar
- Haftalık: north-star + aktivasyon (%60 hedef) + D7 retention raporu
- A/B: tek değişkenli deneyler, en az 1 hafta pencere
