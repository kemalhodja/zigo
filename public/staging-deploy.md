# Zigo Staging Deploy Guide

Use this when moving from **local Docker Supabase** to a **hosted staging URL** (Vercel + Supabase cloud).

## Phase 1 — Supabase cloud project

1. Create a project at [supabase.com](https://supabase.com) (region close to users).
2. Open **SQL Editor** → paste and run `supabase/zigo-full-migrations.sql` (32 migrations bundled).
3. Confirm tables exist: `user_subscriptions.current_period_end`, `study_moment_cheers`.
4. **Authentication → URL configuration** — set Site URL to your staging domain (fill after Vercel deploy if unknown yet).
5. Add redirect URLs (copy from `/setup` → Hosted deploy after env is set):
   - `https://<staging>/auth/callback`
   - `https://<staging>/auth/callback?next=/onboarding`
6. Copy **Project URL**, **anon key**, **service role key** into Vercel env (never expose service role to browser).

## Phase 2 — Vercel project

1. Import Git repo → Framework: **Next.js** (see `vercel.json`).
2. Set environment variables:

| Variable | Staging |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-staging.vercel.app` (no trailing slash) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (server only) |
| `STRIPE_SECRET_KEY` | test mode secret (optional for staging) |
| `STRIPE_PRICE_ID_ZIGO_PLUS` | test price id |
| `STRIPE_WEBHOOK_SECRET` | from Stripe webhook after deploy |
| `NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED` | `true` when testing Plus |
| `ZIGO_BILLING_DEV_BYPASS` | **`false`** on hosted staging |
| `NEXT_PUBLIC_ZIGO_BILLING_DEV_BYPASS` | **`false`** on hosted staging |

3. Deploy. Note the production/preview URL.
4. Update `NEXT_PUBLIC_SITE_URL` if the final domain differs, then redeploy.

## Phase 3 — Stripe (staging)

1. Stripe Dashboard → **Developers → Webhooks** → Add endpoint:
   - URL: `https://<staging>/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
2. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Vercel → redeploy.
3. Test checkout with Stripe test card `4242 4242 4242 4242`.

## Phase 4 — Verify

From your machine with staging env in `.env.local` (or CI secrets):

```bash
npm run migrations:bundle
npm run staging:preflight -- --skip-build
npm run test:live
node scripts/manual-student-journey.mjs
```

Manual checks on staging URL:

- [ ] Register student / parent / teacher
- [ ] Admin verify teacher + assign areas
- [ ] Match-Feed, focus, store visit, legal footer links
- [ ] Zigo Plus checkout (test mode) → `/billing/success`

## Phase 5 — Android (optional)

```env
CAPACITOR_SERVER_URL=https://your-staging.vercel.app
```

```bash
npm run android:preflight
```

See also `/hosted-deploy-checklist.md` and `/launch-checklist.md`.
