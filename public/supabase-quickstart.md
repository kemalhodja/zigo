# Zigo Supabase Quickstart

Fast path from zero to a working live project.

## 1. Create the Supabase project

1. Open [supabase.com](https://supabase.com) and create a project.
2. Copy **Project URL** and **anon public** key from Settings → API.
3. Copy **service_role** key for server-only checks (never expose to the browser).

## 2. Bootstrap local env

From the Zigo repo root:

```bash
npm run setup:env
npm run env:check
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## 3. Apply migrations

Option A — one paste:

```bash
npm run migrations:bundle
```

Open `supabase/zigo-full-migrations.sql` in Supabase Dashboard → SQL Editor and run it once.

Option B — file by file:

Run every file in `supabase/migrations` **in numeric order** through:

- Supabase Dashboard → SQL Editor, or
- Supabase CLI after `supabase link`

Required range: `001_initial_schema.sql` through `027_student_read_own_social_text.sql`.

## 4. Configure Auth redirects

Supabase → Authentication → URL configuration:

| Field | Value |
| --- | --- |
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |
| Redirect URLs | `http://localhost:3000/auth/callback?next=/onboarding` |

Copy the exact URLs from `/setup` → **Hosted deploy** if you prefer.

## 5. Verify automatically

```bash
npm run test:live
npm run test:deploy
npm run setup:verify
```

Green output means schema, storage, admin and deploy wiring look correct.

## 6. Bootstrap admin and content

1. Register accounts from `/auth` (student, parent, teacher).
2. Run the SQL from `/setup` → **First admin SQL** with your user id.
3. Open `/admin` → verify teacher → assign education areas.
4. If feed is empty, migration `017` already seeds demo content when applied.

## 7. Manual QA

Open `/setup` or `/readiness` and complete the **Manual role QA** panel.

Also see:

- `docs/manual-qa-checklist.md`
- `docs/hosted-deploy-checklist.md`
- `docs/final-acceptance-checklist.md`
