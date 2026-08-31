# Video CDN PoC — Egress Fatura Canavarı Kesimi

**Hedef:** Supabase Storage egress $0.09/GB → Bunny $0.01/GB (%88 tasarruf). 1 viral reel (1000 kullanıcı × 30MB = 30GB/gün = 900GB/ay) → Supabase 2700₺/ay → Bunny 300₺/ay.

## Mimari (Seçenekler)

| Provider | Maliyet/GB | Gecikme | Kurulum | Öneri |
|----------|------------|---------|---------|-------|
| **Bunny.net Pull Zone** | $0.01 | 40ms | 5 dk | **MVP PoC → Önerilen** |
| Mux | $0.04 + encoding | 30ms | 1 gün | HLS adaptive gerekirse |
| Cloudflare R2 + CDN | $0 egress + $0.015 | 50ms | 2 saat | R2 migration gerekirse |
| Supabase direkt | $0.09 | 120ms | 0 | Fatura yakar |

## Bunny PoC Adımları (5 dk)

1. bunny.net → Pull Zone oluştur → Origin: `https://<supabase>.supabase.co/storage/v1/object/public/social-media/`
2. Vercel Env ekle:
   ```
   NEXT_PUBLIC_BUNNY_PULL_ZONE=bunny-zigo.b-cdn.net
   NEXT_PUBLIC_BUNNY_TOKEN_ENABLED=false # PoC'de kapalı, prod'da true + /api/video/bunny-token
   ```
3. Kod zaten hazır: `getVideoPlaybackUrl` otomatik Bunny'ye rewrite eder.
4. Deploy → `NEXT_PUBLIC_VIDEO_CDN_BASE` fallback de çalışır.

## Mux (Opsiyonel HLS)

```env
NEXT_PUBLIC_MUX_PLAYBACK_BASE=https://stream.mux.com
NEXT_PUBLIC_VIDEO_HLS_ENABLED=true
# storagePath = "mux:<playbackId>" → /playlist.m3u8
```

## Pro Plan Notu

`vercel.json` tek region `fra1` (Hobby). **Pro plan aktif olunca** `vercel.pro.json` kullan:

```json
{ "regions": ["fra1", "iad1"], "functions": { "src/app/api/**/*.ts": { "maxDuration": 30 } } }
```

Deploy: `vercel --prod --config vercel.pro.json` veya Dashboard → Pro upgrade → regions auto.

## Maliyet Hesaplama

```ts
import { estimateMonthlyEgressCost } from "@/lib/domain/video-delivery";
estimateMonthlyEgressCost(900, "bunny"); // { costTry: 297, savingsTry: 2403 }
```

## Doğrulama

```bash
npm run video:cdn-check
# PASS Bunny pull zone reachable + HLS fallback
```

## Rollback

Env'i sil → otomatik Supabase fallback. Kesinti yok.
