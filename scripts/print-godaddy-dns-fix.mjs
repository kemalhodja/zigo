/* global console, process */

/**
 * Prints the exact GoDaddy → Vercel DNS steps for zigo.app.
 * Run: npm run dns:fix:print
 */

const APEX = "zigo.app";
const VERCEL_A = "76.76.21.21";
const VERCEL_WWW_CNAME = "cname.vercel-dns.com";
const FALLBACK = "https://zigo-kohl.vercel.app";

console.log(`
=== Zigo DNS fix (ERR_CONNECTION_CLOSED) ===

App is healthy at: ${FALLBACK}
Custom domain ${APEX} still points at GoDaddy parking IPs and aborts TLS.

--- A) Vercel (dashboard) ---
1. Open https://vercel.com → project "zigo" → Settings → Domains
2. Add: ${APEX}
3. Add: www.${APEX} (redirect to ${APEX} is fine)
4. Copy the exact A / CNAME values Vercel shows if they differ from below

--- B) GoDaddy DNS (domaincontrol) ---
1. Open https://dcc.godaddy.com → Domains → ${APEX} → DNS
2. DELETE parking / forwarding A records:
   - 13.248.243.5
   - 76.223.105.230
3. Turn OFF "Forwarding" / "Domain Forwarding" if enabled
4. ADD / REPLACE:

   Type  Name  Value                 TTL
   A     @     ${VERCEL_A}           600
   CNAME www   ${VERCEL_WWW_CNAME}   600

5. Save. Wait for Vercel Domains to show Valid (often minutes, sometimes longer)

--- C) App env after TLS is Valid ---
Vercel → Environment Variables (Production):
  NEXT_PUBLIC_SITE_URL=https://${APEX}
  ZIGO_USE_CANONICAL_DOMAIN=1
  CAPACITOR_SERVER_URL=https://${APEX}

Supabase → Authentication → URL configuration:
  Site URL: https://${APEX}
  Redirect: https://${APEX}/auth/callback
  Redirect: https://${APEX}/auth/callback?next=/onboarding

Rebuild Android:
  set CAPACITOR_SERVER_URL=https://${APEX}
  npm run android:build:release

--- Until DNS is fixed (right now) ---
Open: ${FALLBACK}
Keep NEXT_PUBLIC_SITE_URL on the Vercel host OR leave ZIGO_USE_CANONICAL_DOMAIN unset
so auth redirects bypass broken ${APEX}.

Verify:
  npm run origin:check
  curl -I https://${APEX}
`);

process.exit(0);
