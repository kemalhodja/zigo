# Deploy Zigo on Vercel

Use this when you want a public HTTPS URL before Android APK handoff.

## 1. Import the repo

1. Open [vercel.com/new](https://vercel.com/new).
2. Import the Zigo Git repository.
3. Framework preset should auto-detect **Next.js**.
4. Keep the default output settings.

`vercel.json` in the repo already sets:

- `installCommand`: `npm ci`
- `buildCommand`: `npm run build`

## 2. Add environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Name | Environments | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Public anon key |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://your-domain.vercel.app` or custom domain |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Server-only; never expose to browser |

For preview deployments you can set `NEXT_PUBLIC_SITE_URL` to the production domain, or rely on Vercel's `VERCEL_URL` fallback for auth redirects during early testing.

## 3. Deploy

Click **Deploy**. First build should pass if CI is green locally:

```bash
npm run test:smoke
npm run test:migrations
npm run typecheck
npm run build
```

## 4. Update Supabase Auth

After the first deploy, copy redirect URLs from:

`https://YOUR_DEPLOYMENT/setup` → **Hosted deploy**

Add them in Supabase → Authentication → URL configuration:

- Site URL = your `NEXT_PUBLIC_SITE_URL`
- Redirect URLs = `/auth/callback` and `/auth/callback?next=/onboarding`

## 5. Apply database migrations

If not done yet:

```bash
npm run migrations:bundle
```

Paste `supabase/zigo-full-migrations.sql` into Supabase SQL Editor.

## 6. Post-deploy verification

With production env values loaded locally, or from CI secrets:

```bash
npm run test:live
npm run test:deploy
npm run setup:verify
```

Then open:

- `/setup` → Launch path
- `/readiness` → Manual role QA

## 7. Custom domain (optional)

1. Vercel → Domains → add your domain.
2. Update `NEXT_PUBLIC_SITE_URL` to the custom domain.
3. Redeploy.
4. Update Supabase Auth redirect URLs to the custom domain.

## 8. Android

Set:

```env
CAPACITOR_SERVER_URL=https://your-production-domain
```

Then:

```bash
npm run android:preflight
npm run android:sync
```
