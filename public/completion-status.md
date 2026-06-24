# Zigo completion status

Local MVP is **100/100 code-complete** (migration **033**, KVKK compliance, acceptance gate).

## One-command local verification

```bash
npm run setup:complete
```

Requires: Docker Supabase running, production server on port **3004** (or set `E2E_BASE_URL`).

```powershell
npm run build:safe
npm run start -- -p 3004
$env:E2E_BASE_URL="http://localhost:3004"
npm run setup:complete
```

## Hosted staging

See `docs/staging-deploy.md` and apply migrations **001–033**.

## Score

Local platform **100/100** when `npm run test:acceptance` passes. Cloud deploy remains operator-side.
