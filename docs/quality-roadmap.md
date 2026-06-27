# Quality roadmap (§5–§11)

Consolidated engineering quality program for Zigo. Each section has automated audits wired into `audit:all`.

## Section index

| § | Topic | Audit command | Doc |
| --- | --- | --- | --- |
| 5 | UX quality | `npm run audit:ux` | `docs/ux-quality.md` |
| 6 | Production readiness | `npm run audit:production` | `docs/production-readiness.md` |
| 7 | Compliance (KVKK) | `npm run audit:compliance` | `docs/compliance.md` |
| 8 | Education core | `npm run audit:education` | `docs/education-core.md` |
| 9 | Platform quality | `npm run audit:platform` | `docs/platform-quality.md` |
| 10 | Final launch | `npm run audit:launch` | `docs/final-launch.md` |
| 11 | Doc sync & consolidation | `npm run audit:consolidation` | this file |

## One command

```bash
npm run audit:all          # 40 audit scripts
npm run test:repo:fast     # audit:all + migrations + smoke + unit + lint
npm run test:ci            # CI parity (repo + coverage + build)
npm run test:acceptance    # platform score ≥95
```

## Migration target

Current bundle: **001–055** (`MIGRATION_TARGET = 55` on `/api/setup/health`). Latest migrations may extend to **056+** during active development.

Apply on every hosted Supabase project before launch:

```bash
npm run migrations:bundle
# SQL Editor → supabase/zigo-full-migrations.sql
```

## Pre-launch chain

```bash
npm run audit:consolidation
npm run test:repo:fast
npm run staging:preflight
npm run test:acceptance
npm run uptime:probe
```

Manual sign-off: `docs/final-acceptance-checklist.md`.

## Non-automated (human)

- Lawyer review of `/legal/*`
- Production domain + Stripe live mode
- App Store / Play Store listing copy
- Quarterly backup restore drill

## Related

- `docs/social-polish-roadmap.md` — UI polish phases
- `docs/completion-status.md` — current migration status
- `docs/qa-coverage-map.md` — test coverage map
