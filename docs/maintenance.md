# Zigo maintenance cadence

Recurring tasks that keep the repo healthy between feature work.

## Weekly (during active development)

| Task | Command |
| --- | --- |
| Fast repo gate | `npm run test:repo:fast` |
| TypeScript audit | `npm run audit:typescript` |

## Before release / demo

| Task | Command |
| --- | --- |
| Full repo gate (+ Playwright) | `npm run test:repo` |
| Release gate | `npm run test:release` |
| Live stack (Docker required) | `ZIGO_RUN_LIVE_TESTS=1 npm run test:live:all` |
| Bundle size review | `npm run analyze` |

## Quarterly

| Task | Command | Notes |
| --- | --- | --- |
| Dependency audit | `npm run audit:deps` | Fails on **high/critical** by default |
| Operational security | `npm run audit:ops` | CSP, CORS, env leak scan |
| Secret rotation review | See `docs/operational-security.md` | Every **90 days** or after incident |
| Dead-code scan | `npm run audit:dead-code` | Remove orphans or allowlist intentionally |
| Maintenance bundle | `npm run audit:maintenance` | Runs both audits |
| Minor dependency bumps | `npm outdated` → patch/minor PR | Avoid `--force` without review |
| ADR review | Read `docs/adr/` | Add ADR when changing feed/auth/migration strategy |

## After each migration

1. `npm run db:types` (local Supabase running)
2. `npm run test:migrations`
3. Update smoke invariants if domain strings moved

## One-time codemods

Do **not** keep finished codemod scripts in `scripts/` unless wired to npm or referenced by journey/smoke tooling. Remove or document in `scripts/dead-code-allowlist.json`.

## Related docs

- `docs/testing-regression.md` — gate commands after refactors
- `docs/adr/` — architecture decisions
- `docs/completion-status.md` — launch checklist
- `docs/operational-security.md` — backups, logs, secret rotation
- `docs/incident-response-runbook.md` — SEV-1/2/3 playbooks
