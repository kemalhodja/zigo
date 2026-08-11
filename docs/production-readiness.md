# Production readiness

Operational checklist for staging → production launch (roadmap §6).

## Verification commands

```bash
npm run audit:production
npm run staging:preflight          # hosted URL + Supabase env
npm run test:release                 # test:repo + coverage + live (optional)
npm run uptime:probe                 # GET /api/setup/health
```

Included in `test:repo:fast` via `audit:production`.

## Environments

| Environment | Supabase | Vercel | Seed data |
| --- | --- | --- | --- |
| **Local** | Docker `supabase start` | `npm run dev` | Demo auth seed OK |
| **Staging** | Cloud project (EU) | Preview or staging domain | Demo accounts only |
| **Production** | Cloud project (EU, KVKK) | Production domain | No demo seeds |

Copy `.env.staging.example` → Vercel env. Never commit secrets.

## Migrations

1. `npm run migrations:bundle` → `supabase/zigo-full-migrations.sql`
2. Apply on cloud (**001–077**)
3. Confirm health: `migrationTarget: 91` on `/api/setup/health`

## Deploy pipeline

| Gate | Command | CI |
| --- | --- | --- |
| Fast repo | `npm run test:repo:fast` | — |
| Full repo + Playwright | `npm run test:repo` | `.github/workflows/ci.yml` |
| Release | `npm run test:release` | Manual / pre-tag |
| Nightly live | `npm run test:live:all` | `.github/workflows/live-tests-nightly.yml` (Mon 03:00 UTC) |

## Rollback

1. Vercel → Deployments → **Promote** previous production deployment.
2. Database: prefer Supabase PITR restore; do not replay down migrations in prod.
3. Rotate secrets if bad deploy exposed keys (see `docs/operational-security.md`).

## Backup & restore drill (quarterly)

1. Supabase dashboard → Backups / PITR enabled.
2. Staging clone: new project → apply bundled SQL → `staging:preflight`.
3. Record RTO/RPO in incident notes.

## Monitoring

| Signal | Source | Action |
| --- | --- | --- |
| App health | `GET /api/setup/health` | Uptime robot / cron `npm run uptime:probe` |
| Live gates | `data.readyCount` vs `totalCount` | Fix failing gate in `/setup` |
| Auth errors | Supabase Auth logs | Spike → incident runbook |
| RLS denies | Postgres logs | Policy regression |
| Stripe webhooks | Stripe dashboard | Re-run `npm run test:stripe-webhook` |
| Errors (optional) | `SENTRY_DSN` / Vercel logs | Wire `@sentry/nextjs` when DSN set |

Health response shape:

```json
{
  "data": {
    "status": "healthy | degraded",
    "migrationTarget": 55,
    "appVersion": "1.0.0",
    "readyCount": 12,
    "totalCount": 12
  }
}
```

## Post-launch cadence

| When | Task |
| --- | --- |
| Weekly | `npm run test:journey` on staging |
| Weekly | Review moderation + report queue SLA |
| Monthly | `npm run audit:all` on release branch |
| Quarterly | Backup restore drill + secret rotation review |

## Related docs

- `docs/production-checklist.md` — launch sign-off
- `docs/final-launch.md` — CI parity and hosted launch (§10)
- `docs/hosted-deploy-checklist.md` — Vercel + Supabase Cloud
- `docs/incident-response-runbook.md` — SEV-1/2/3
- `docs/operational-security.md` — secrets, CSP, env leak scan
