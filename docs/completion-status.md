# Zigo completion status

Local MVP is **code-complete** at migration **055** (moderation strikes, demo social reset, verified teacher answers RLS).

## One-command local verification

```bash
npm run setup:complete
```

Runs **full scorecard** (`npm run test:all`): migration bundle → migrations → smoke → RLS → deploy → video → mobile → live Supabase → typecheck → lint → env → journey → runtime API checks.

Requires: Docker Supabase + production server (`npm run build:safe && npm run start -- -p 3005`).

```powershell
npm run build:safe
npm run start -- -p 3005
$env:E2E_BASE_URL="http://localhost:3005"
npm run setup:complete
```

Quick score only: `npm run test:scorecard`

## Hosted staging (your accounts)

1. Copy `.env.staging.example` → fill values → Vercel env
2. `npm run migrations:cloud` (or paste SQL bundle in Supabase dashboard — **001–055**)
3. Pending only: `npm run migrations:pending` (applies **050–055** if missing)
3. Deploy Vercel → set Supabase Auth redirect URLs from `/setup`
4. Stripe webhook → `STRIPE_WEBHOOK_SECRET` → redeploy
5. `npm run staging:preflight`

## Automated coverage

| Suite | Command |
| --- | --- |
| Repo gates | `npm run test:repo` |
| Live Supabase | `npm run test:live` |
| Live role matrix | `npm run test:live:matrix` |
| Live full suite | `npm run test:live:all` (needs `ZIGO_RUN_LIVE_TESTS=1`) |
| E2E API + legal | `npm run test:e2e` |
| Student journey | `node scripts/manual-student-journey.mjs` |
| Parent journey | `node scripts/manual-parent-journey.mjs` |
| Teacher journey | `node scripts/manual-teacher-journey.mjs` |
| All roles | `npm run test:journey` |
| Platform score | `npm run test:acceptance` |
| Unit tests (Vitest) | `npm run test:unit` |
| Unit coverage gate | `npm run test:unit:coverage` |
| Release gate | `npm run test:release` |
| TypeScript audit | `npm run audit:typescript` |
| Maintenance audits | `npm run audit:maintenance` |
| Security audits | `npm run audit:security` |
| Auth production audit | `npm run audit:auth` |
| Platform quality audit | `npm run audit:platform` |
| Full audit bundle | `npm run audit:all` |
| DB types sync | `npm run db:types` |
| Visual wiring probe | `npm run test:visual` |
| Production launch | `docs/production-checklist.md` |

## Recent migrations (037–044)

- **037** — User profile extensions, student document RPCs
- **038** — Email verification + student document auth gates, reCAPTCHA
- **039** — Unified `social_posts` feed model
- **040** — Keyword moderation + DB triggers
- **041** — Multi-question quiz engine + parent quiz activity RPC
- **042** — Parent child activity timeline (quiz + video + learning events)
- **043** — Content moderation publish RLS (pending comments/replies, report updates)
- **044** — Product scope hardening (parent store approval RPC, verified video gate, duel area)

## Remaining non-code items

- Lawyer review of `/legal/*` pages
- Supabase Cloud + Vercel deploy with real domain
- Stripe live mode (when charging real users)
- Production video CDN + Web Push (env + infra)
- Phone LAN QA
- App Store / Play Store listing

**Score:** run `npm run test:repo` for CI-equivalent gates (includes Playwright). Use `npm run test:repo:fast` to skip browser tests locally. Full scorecard needs live Supabase + running server.

See `docs/testing-regression.md` when splitting domain modules.
