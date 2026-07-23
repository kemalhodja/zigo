# Fix zigo.app ERR_CONNECTION_CLOSED

## Symptom

Browser or Android WebView shows **ERR_CONNECTION_CLOSED** (or OpenSSL `SSL_ERROR_SYSCALL`) when opening `https://zigo.app`.

## Diagnosis (2026-07-23)

| Origin | Status |
| --- | --- |
| `https://zigo-kohl.vercel.app` | Healthy — `/api/setup/health` returns 13/13 gates |
| `https://zigo.app` | TCP connects, TLS handshake aborts (no certificate) |
| `https://www.zigo.app` | Same TLS failure |

DNS for `zigo.app` uses GoDaddy nameservers (`ns17/ns18.domaincontrol.com`) and A records:

- `13.248.243.5`
- `76.223.105.230`

Those are **not** Vercel anycast IPs. They belong to GoDaddy domain forwarding / parking and close the TLS connection — which browsers report as ERR_CONNECTION_CLOSED.

The Next.js app itself is fine on Vercel. Only the custom domain is broken.

## Immediate workaround

Use the working host:

```text
https://zigo-kohl.vercel.app
```

Print exact GoDaddy + Vercel steps anytime:

```bash
npm run dns:fix:print
```

Until DNS is Valid, the app **bypasses** `NEXT_PUBLIC_SITE_URL=https://zigo.app` and uses
`https://zigo-kohl.vercel.app` for auth/billing redirects (unless `ZIGO_USE_CANONICAL_DOMAIN=1`).

For Android / Capacitor until DNS is fixed:

```bash
set CAPACITOR_SERVER_URL=https://zigo-kohl.vercel.app
npm run android:sync
```

Release builds default to this URL when `CAPACITOR_SERVER_URL` is unset.

Also set Vercel env (temporary):

```env
NEXT_PUBLIC_SITE_URL=https://zigo-kohl.vercel.app
```

And add the matching Supabase Auth redirect URLs:

- `https://zigo-kohl.vercel.app/auth/callback`
- `https://zigo-kohl.vercel.app/auth/callback?next=/onboarding`

## Permanent fix (DNS → Vercel)

1. Vercel → Project → **Settings → Domains** → add `zigo.app` and `www.zigo.app`.
2. In GoDaddy DNS for `zigo.app`, remove parking / forwarding A records.
3. Apply the records Vercel shows (typical):
   - Apex `A` → `76.76.21.21` (or the exact values Vercel lists)
   - `www` `CNAME` → `cname.vercel-dns.com`
4. Wait for TLS certificate provisioning (Vercel Domains should show **Valid**).
5. Verify:

```bash
curl -I https://zigo.app
npm run origin:check
```

6. Restore production env:

```env
NEXT_PUBLIC_SITE_URL=https://zigo.app
CAPACITOR_SERVER_URL=https://zigo.app
```

7. Update Supabase Auth Site URL + redirect URLs back to `https://zigo.app/...`.
8. Rebuild the Android AAB so Capacitor points at the fixed domain.

## Verify from repo

```bash
# Probes canonical + fallback origins
npm run origin:check

# Hosted uptime (set ZIGO_HEALTH_URL)
ZIGO_HEALTH_URL=https://zigo-kohl.vercel.app npm run uptime:probe
```

## Related

- `docs/incident-response-runbook.md` — playbook: custom domain TLS down
- `docs/mobile-apk-checklist.md` — Capacitor URL
- `docs/vercel-deploy.md` — custom domain section
