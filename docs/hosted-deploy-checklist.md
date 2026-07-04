# Zigo Hosted Deploy Checklist

Use this after repository checks pass and before sharing a public URL or syncing Android.

## 0. Staging preflight

```bash
npm run migrations:bundle
# Set hosted NEXT_PUBLIC_SITE_URL in .env.local (not localhost)
npm run staging:preflight
```

Full walkthrough: `docs/staging-deploy.md`

## 1. Pick a host

Recommended: **Vercel** for the Next.js app.

- Import the Zigo repository.
- Framework preset: Next.js.
- Build command: `npm run build` (or `npm run build:safe` if you want a clean `.next` first).
- Output: default Next.js.

## 2. Environment variables

Set these in the hosting dashboard (and in local `.env.local` for parity):

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Public | `https://your-domain.example` — no trailing slash |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | For `/api/setup/health` and `npm run test:live` |
| `STRIPE_SECRET_KEY` | Server only | Stripe test/live secret |
| `STRIPE_PRICE_ID_ZIGO_PLUS` | Server only | Zigo Plus price id |
| `STRIPE_WEBHOOK_SECRET` | Server only | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED` | Public | `true` when billing is ready |
| `ZIGO_BILLING_DEV_BYPASS` | Server only | **`false` on hosted staging/prod** |

Never expose `SUPABASE_SERVICE_ROLE_KEY` or Stripe secrets to the browser.

## 3. Supabase database

Run `supabase/zigo-full-migrations.sql` (migrations **001–044**) in the Supabase SQL editor before first deploy.
Confirm `account_deletion_requests`, `export_user_data()`, and `parent_update_store_redemption_status()` exist after apply.

## 4. Supabase Auth redirect URLs

In Supabase → Authentication → URL configuration:

1. **Site URL**: same as `NEXT_PUBLIC_SITE_URL`
2. **Redirect URLs** — add both:
   - `https://your-domain.example/auth/callback`
   - `https://your-domain.example/auth/callback?next=/onboarding`

For local development also keep:

- `http://localhost:3000/auth/callback`
- `http://localhost:3001/auth/callback`
- `http://localhost:3000/auth/callback?next=/onboarding`

## 5. Stripe webhook

In Stripe → Developers → Webhooks:

- Endpoint: `https://your-domain.example/api/billing/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## 6. Verify auth callback

1. Open `/setup` and copy the redirect URLs from **Hosted deploy**.
2. Register a test user from `/auth`.
3. Confirm email (if enabled) lands on `/onboarding` through `/auth/callback`.
4. Sign out and sign in again without errors.

## 7. Post-deploy commands

Run against the hosted project (CI or local with production env):

```bash
npm run audit:launch
npm run test:acceptance
npm run test:smoke
npm run test:rls
npm run test:live
npm run test:deploy
npm run staging:preflight -- --skip-build
npm run uptime:probe
npm run typecheck
```

## 8. Android / Capacitor

Before `npm run android:sync`:

```env
CAPACITOR_SERVER_URL=https://your-domain.example
```

Then run `npm run android:preflight`.

## 9. Manual QA

Open `/readiness` or `/setup` and complete the **Manual role QA** panel for student, parent, teacher and admin accounts.

Also run `docs/manual-qa-checklist.md` and `docs/launch-checklist.md`.
