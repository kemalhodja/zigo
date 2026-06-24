# ADR 0004: Migration squash / baseline plan

## Status

Proposed (execute before first production Supabase project, not required for local dev)

## Context

The repository ships **42** sequential SQL migrations (`001`–`042`). Fresh local Docker setups replay them quickly, but new cloud projects and CI staging resets pay mounting apply time and review overhead.

## Decision

1. **Keep numbered migrations for active development** until launch freeze.
2. At launch freeze, generate a **baseline migration**:
   - `supabase db dump --schema-only` from a database that applied `001`–`042`.
   - Store as `supabase/migrations/000_baseline.sql` (or replace bundle output in `zigo-full-migrations.sql`).
3. Archive historical migrations under `supabase/migrations/archive/` with a README pointing to git tag `pre-baseline`.
4. Update `scripts/bundle-migrations.mjs` and `scripts/test-migrations.mjs` to expect baseline + delta files post-squash.

## Consequences

- Existing environments that already applied `001`–`042` must **not** replay baseline; use migration repair / manual mark-applied.
- New environments apply baseline once, then only incremental migrations.
- Document the cutover in release notes and `docs/staging-deploy.md`.

## Checklist (when executing)

- [ ] Tag release before squash (`git tag pre-migration-baseline`)
- [ ] Regenerate bundled SQL (`npm run migrations:bundle`)
- [ ] Run `npm run test:live:all` against fresh Supabase volume
- [ ] Update setup docs and Vercel/Supabase runbooks
