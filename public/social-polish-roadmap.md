# Zigo Sosyal Kabuk İyileştirme Yol Haritası

Bu plan, Zigo'nun ana sosyal yüzeylerini (Home, Reels, Explore, Profile, Create) **modern mobil sosyal feed** standardına taşır. Eğitim/gamification ikincil kalır; ilk 10 saniye Instagram benzeri değil, **Zigo sosyal kabuğu** hissi verir.

## Faz 0 — Temel (tamamlandı / sürekli)

- Tailwind v4 CSS düzeltmesi (`@import "tailwindcss"`)
- Güvenli marka dili (`docs/safe-instagram-feel-checklist.md`)
- `zigo-*` CSS sınıfları, smoke + readiness zinciri

## Faz 1 — Shell ve sistem (bu sprint)

| Madde | Hedef | Dosyalar |
| --- | --- | --- |
| Tipografi | Plus Jakarta Sans ile marka hissi | `layout.tsx`, `tailwind.config.ts` |
| Bildirim ikonu | Kalp → zil; rozet sadece header'da | `app-shell.tsx`, `bottom-nav.tsx` |
| Border tutarlılığı | `border-slate-100` tek dil | Explore, loading skeletons |
| Grid etiketleri | Masonry karelerde görünür başlık | `globals.css`, Explore, Profile |
| Zaman damgası | Feed'de gerçek `created_at` | `format-time.ts`, `page.tsx` |

## Faz 2 — Home yoğunluğu

| Madde | Hedef | Dosyalar |
| --- | --- | --- |
| Feed pulse | Gizli hero açılır, kompakt sosyal özet | `page.tsx` `HomeLearningPulse` |
| Reels rail | Yatay “Reels to watch” şeridi | `page.tsx` `ReelSpotlightRail` |
| Öğrenci şeridi | Puan/kristal/streak üst bant (rol=student) | `student-social-strip.tsx` |
| Mobil ipuçları | Double-tap like hover yerine her zaman hafif görünür | `double-tap-like-link.tsx` |

## Faz 3 — Reels immersive

| Madde | Hedef | Dosyalar |
| --- | --- | --- |
| Sticky tabs | For You / Following sabit üstte | `reels/page.tsx` |
| İzleme çubuğu | Progress + ödül rozeti görünür | `reels/page.tsx` |
| Ses etiketi | “Original audio” → nötr “Creator audio” | `reels/page.tsx` |

## Faz 4 — Explore ve Profile

| Madde | Hedef | Dosyalar |
| --- | --- | --- |
| Trend radar | Keşif üst hero açılır | `explore/page.tsx` |
| Topic bridges | Yatay köprü kartları | `explore/page.tsx` |
| Profile actions | Story / reel / saved hızlı aksiyonlar | `profile/page.tsx` |
| Profile insights | Takipçi ve grid özeti | `profile/page.tsx` |

## Faz 5 — Create stüdyo

| Madde | Hedef | Dosyalar |
| --- | --- | --- |
| Tek mod seçici | URL tab'ları (hero); composer duplicate kaldır | `create/page.tsx`, `create-mode-composer.tsx` |
| Publish safety | Doğrulama adımları görünür şerit | `create/page.tsx` |
| Studio hero | Gradient creator başlığı görünür | `create/page.tsx` |

## Faz 6 — Veri ve demo (bu sprint)

- [x] Creator rail'de gerçek `followingId` (`getSuggestedCreators`)
- [x] Thumbnail önceliği (`SocialMediaFrame` lazy `img` / video)
- [x] Rol bazlı tema varyantları (`role-theme.ts`, header chip)
- [x] Explore/Profile'da tam canlı creator keşfi (Teachers sekmesi + profile discovery rail)

## Faz 7 — Canlı ortam ve QA (bu sprint)

- [x] `getLiveGates()` otomatik şema/storage/admin kontrolü
- [x] `/api/setup/health` + `/setup` + `/readiness` canlı panel
- [x] `npm run test:live` CLI script
- [x] `SUPABASE_SERVICE_ROLE_KEY` `.env.example` dokümantasyonu
- [x] Hosted deploy kartı + `docs/hosted-deploy-checklist.md` + `npm run test:deploy`
- [x] Rol bazlı manuel QA paneli (`RoleQaPanel` on `/setup` and `/readiness`)
- [ ] Manuel rol QA tamamlandı (canlı projede checkbox'lar)
- [ ] Hosted deploy canlıda doğrulandı (auth email + callback)

## Faz 8 — Lansman (sıradaki)

- [x] Migration bundle (`npm run migrations:bundle`) + `test:migrations`
- [x] GitHub Actions CI (smoke, RLS, deploy, mobile, typecheck)
- [x] Preview mode banner → `/setup`
- [x] Vercel config + `docs/vercel-deploy.md` + `npm run env:check`
- [x] Yerel Supabase (`npm run setup:local`, migration 024 dahil)
- [x] `npm run setup:verify` yeşil (yerel)
- [x] `npm run test:repo` + `build:safe` yeşil
- [ ] Production deploy doğrulandı (canlı auth email + callback)
- [ ] `RoleQaPanel` dört rol tamamlandı (canlı projede)
- [ ] APK `CAPACITOR_SERVER_URL` hosted domain

## Başarı kriterleri

- İlk ekran: story tray + pulse + en az bir içerik yoğunluğu bloğu
- Grid: her karede okunabilir başlık
- Reels: tabs kaybolmaz, swipe hissi korunur
- Create: tek mod akışı, güvenlik adımları görünür
- Smoke: `npm run test:smoke` yeşil

## Uygulama sırası (bu oturum)

1. Faz 1 → 5 kod değişiklikleri
2. Smoke test güncellemesi
3. `npm run test:smoke` doğrulama
