# Zigo Yaz 2026 — Stripe %75 kampanya kuponu

Kampanya **31 Temmuz 2026 23:59 (TR)** tarihine kadar geçerlidir.

## Otomatik kurulum (önerilen)

1. Stripe Dashboard → **Developers → API keys** → Secret key kopyalayın.
2. Vercel → **zigo** → Settings → Environment Variables → Production:
   - `STRIPE_SECRET_KEY` = `sk_live_...` (test için `sk_test_...`)
   - Diğer `STRIPE_PRICE_*` anahtarları da tanımlı olmalı.
3. Yerelde geçici olarak `.env.production.local` içine `STRIPE_SECRET_KEY=...` yazın.
4. Çalıştırın:

```bash
npm run stripe:campaign-coupon -- --sync-vercel
npx vercel --prod --yes
```

Script şunları oluşturur:

| Alan | Değer |
|------|-------|
| Kupon ID | `zigo-yaz-2026-75off` |
| İndirim | %75 |
| Süre | İlk fatura (`once`) |
| Son kullanım | 31 Temmuz 2026 23:59 TR |
| Promosyon kodu | `YAZ75` |

Vercel env: `STRIPE_COUPON_CAMPAIGN_75OFF=zigo-yaz-2026-75off`

Kod, env yoksa varsayılan olarak aynı kupon ID'sini kullanır.

## Manuel kurulum (Stripe Dashboard)

**Coupons → Create coupon**

- **Coupon ID:** `zigo-yaz-2026-75off`
- **Name:** Zigo Yaz 2026 %75
- **Type:** Percentage → **75%**
- **Duration:** Once
- **Redeem by:** 31 Jul 2026, 23:59 (Europe/Istanbul)

İsteğe bağlı **Promotion codes → Create** → kod: `YAZ75`

Sonra Vercel'e ekleyin: `STRIPE_COUPON_CAMPAIGN_75OFF=zigo-yaz-2026-75off` → redeploy.

## Not

Production Vercel projesinde henüz `STRIPE_*` env yoksa checkout çalışmaz. Önce Stripe ürün/fiyat ID'lerini (`STRIPE_PRICE_STUDENT_MONTHLY` vb.) tanımlayın.
