# Final launch (§10)

Last-mile gates before public URL, store listing, or production tag.

## Verification

```bash
npm run audit:launch
npm run test:release          # test:repo + coverage + visual (optional live)
npm run staging:preflight     # hosted env + build
npm run test:acceptance       # platform score ≥95
```

Included in `audit:all` / `test:repo:fast`.

## CI alignment

GitHub Actions (`.github/workflows/ci.yml`):

| Step | Command |
| --- | --- |
| Repo gates | `npm run test:repo` (includes `audit:all`) |
| Coverage | `npm run test:unit:coverage` |
| Build | `npm run build:safe` |

Nightly (`.github/workflows/live-tests-nightly.yml`): Supabase + `test:live:all`.

Local CI equivalent:

```bash
npm run test:ci
```

## Hosted launch sequence

1. Apply migrations **001–044** on Supabase Cloud
2. Vercel env from `.env.staging.example` (billing bypass **off**)
3. Auth redirect URLs from `/setup` Hosted deploy card
4. `npm run staging:preflight` against production/staging URL
5. `npm run uptime:probe` with `ZIGO_HEALTH_URL=https://your-domain`
6. Manual: `docs/final-acceptance-checklist.md` sign-off

## Pass criteria

| Gate | Target |
| --- | --- |
| `test:repo:fast` | Green locally before push |
| `test:acceptance` | ≥95/100 |
| `/api/setup/health` | `migrationTarget: 44`, `readyCount === totalCount` |
| Role QA | Student, parent, teacher, admin paths on hosted URL |
| Legal | External review of `/legal/*` (non-automated) |

## Rollback

See `docs/production-readiness.md` — promote previous Vercel deployment; use Supabase PITR for data.

## Related

- `docs/production-checklist.md`
- `docs/hosted-deploy-checklist.md`
- `docs/platform-quality.md` (§9)
- `docs/compliance.md` (§7)
