# Operational security

Runbook for backups, logs, secrets, and incidents on hosted Zigo (Supabase + Vercel).

## Verification

```bash
npm run audit:ops
npm run audit:security   # includes ops + RLS + service-role
```

## Database backup & restore

| Item | Production default |
| --- | --- |
| Supabase automatic backups | Daily (plan-dependent); enable **Point-in-Time Recovery** on Pro |
| Migration source of truth | `supabase/migrations/` + `npm run migrations:bundle` |
| Restore drill | Quarterly on staging clone |

**Restore drill (staging)**

1. Create a fresh Supabase staging project or reset branch DB.
2. Run `supabase/zigo-full-migrations.sql` (migrations **001–043**).
3. Smoke: `npm run staging:preflight` against staging URL.
4. Spot-check Match-Feed read + teacher post in assigned area.

**Disaster**

- Prefer Supabase dashboard restore / PITR to a timestamp before incident.
- If project is lost: new project → apply bundled migrations → rotate all secrets → redeploy Vercel.

## Log retention

| Source | Retention guidance | Sensitive data |
| --- | --- | --- |
| Supabase Postgres logs | 7–90 days by plan; export critical auth/RLS spikes | No passwords in app logs |
| Supabase Auth logs | Keep 30 days minimum for abuse investigations | IP + user id only |
| Vercel function logs | ~24h–7d by plan; ship to external SIEM for production | Never log `SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets |
| Application | Use structured messages; no raw student PII in client console | Moderation queue text stays in DB |

**Rules**

- Do not log request bodies for auth, billing, or account export routes.
- Moderation audit rows live in `moderation_audit_log` (DB), not stdout.

## Secret rotation playbook

Rotate on schedule (**every 90 days**) or immediately after suspected leak.

| Secret | Where | Rotation steps |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Generate new service role JWT → update Vercel env → redeploy → revoke old key if dashboard supports |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API | Rotate anon key → update Vercel + local `.env.local` → redeploy (users re-auth if needed) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Roll key → update Vercel → verify checkout + webhook → delete old key |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks | Roll signing secret → update Vercel → `npm run test:stripe-webhook` |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA admin | Create new key pair → update env → deploy → disable old site key |
| `ZIGO_AI_MODERATION_KEY` | Your AI provider | Issue new API key → update env → smoke one moderated comment path |
| Database password | Supabase → Database | Reset password → update `SUPABASE_DB_URL` if used for `migrations:cloud` |

After any rotation: `npm run staging:preflight` + sign-in smoke on staging.

## `.env` leak prevention

- `.env`, `.env.local`, and `.env.staging` must stay **gitignored** (only `.env.example` / `.env.staging.example` committed).
- Run `npm run audit:ops` locally before push; wire the same script as a pre-commit hook:

```bash
node scripts/env-leak-audit.mjs
```

If a secret was committed: rotate immediately, remove from history (`git filter-repo` or BFG), force-push only after team agreement.

## HTTP hardening

- **CSP + security headers** — `src/lib/server/security-headers.ts`, applied in `next.config.ts`.
- **CORS** — Next.js Route Handlers are same-origin by default; do not add `Access-Control-Allow-Origin: *` on authenticated APIs.
- **Dependency CVEs** — `npm run audit:deps` fails on high/critical (`ZIGO_AUDIT_FAIL_LEVEL`).

## Incident response (summary)

See `docs/incident-response-runbook.md` for severity levels and timelines.

| Severity | Example | Target response |
| --- | --- | --- |
| SEV-1 | Auth bypass, service role exposed, child data leak | 15 min acknowledge, 1 h mitigate |
| SEV-2 | Feed down, Stripe webhooks failing | 30 min acknowledge, 4 h mitigate |
| SEV-3 | Moderation backlog, single-region slowness | Next business day |

**Always:** preserve logs, note incident start (UTC), assign comms owner, rotate affected secrets before closing.

## Related docs

- `docs/auth-production.md` — auth rate limits & reCAPTCHA
- `docs/content-safety.md` — moderation pipeline
- `docs/production-checklist.md` — launch gates
- `docs/maintenance.md` — quarterly cadence
