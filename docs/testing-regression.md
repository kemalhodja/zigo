# Testing regression rules

When you **split, rename, or move domain modules**, static smoke invariants may break even though runtime behavior is unchanged.

## Required steps after domain refactors

1. **Update `readSocialDomain()`** in `scripts/smoke-test.mjs` if files under `src/lib/domain/social/` change.
2. **Run `npm run test:smoke`** — must be 0 FAIL before merge.
3. **Run `npm run test:repo:fast`** — migrations, smoke, RLS, deploy, video, mobile, unit, typecheck, lint.
4. **Run `npm run test:repo`** (includes Playwright) before release or CI-equivalent verification.
5. **Update `scripts/offline-probe.mjs`** if new wiring checks are added (optional but recommended).

## Social domain file list

Smoke concatenates these paths (see `SOCIAL_DOMAIN_FILES` in `scripts/smoke-test.mjs`):

- `src/lib/domain/social.ts` (barrel re-export)
- `src/lib/domain/social/index.ts`
- `src/lib/domain/social/types.ts`
- `src/lib/domain/social/schemas.ts`
- `src/lib/domain/social/helpers.ts`
- `src/lib/domain/social/feed.ts`
- `src/lib/domain/social/interactions.ts`
- `src/lib/domain/social/safety.ts`

If you add a new social submodule with exported logic referenced by smoke invariants, append it to `SOCIAL_DOMAIN_FILES`.

## Other domain splits

When splitting `learning.ts`, `feed.ts`, `questions.ts`, etc.:

- Add a `readLearningDomain()`-style helper in `smoke-test.mjs`, or
- Point each invariant at the specific submodule file.

Do **not** assume the barrel file still contains implementation strings.

## Scorecard & CI gates

| Command | Purpose |
| --- | --- |
| `npm run test:repo:fast` | Quick local gate (~30s, no browser) |
| `npm run test:repo` | Full CI-equivalent gate (+ Playwright) |
| `npm run test:scorecard` | Platform score (Playwright +5 offline, +8 when `ZIGO_RUN_LIVE_TESTS=1`) |
| `ZIGO_RUN_LIVE_TESTS=1` | Enable live Supabase, journey, e2e scorecard suites |

## Playwright (1.2)

- Config: `playwright.config.ts`
- Specs: `e2e/*.spec.ts` (+ `e2e/helpers.ts`)
- **66 tests** — offline: 55 pass, 11 skip (auth flows need local Supabase)
- First run locally: `npx playwright install chromium`
- Skip browser locally: `npm run test:repo:fast`
- Live auth flows (`e2e/auth.spec.ts`) require local Supabase with demo seed; skipped in CI placeholder env
- Set `E2E_SKIP_LIVE_AUTH=1` to force-skip authenticated E2E

| Spec | Coverage |
| --- | --- |
| `smoke.spec.ts` | Health API, home feed |
| `legal.spec.ts` | privacy, terms, kvkk, delete-account |
| `routes.spec.ts` | Legacy redirects, public pages |
| `api.spec.ts` | Legacy `/api/posts` → 410, health |
| `accessibility.spec.ts` | Skip link, main landmark |
| `mobile.spec.ts` | 390×844 viewport |
| `pwa.spec.ts` | `/offline.html` |
| `auth.spec.ts` | Demo login → profiles (live only) |

## Live / integration (1.3)

Requires Docker + local Supabase (`npx supabase start`) and `.env.local` from `npm run setup:local`.

| Command | Purpose |
| --- | --- |
| `npm run test:live` | Schema, seed, demo auth, Match-Feed probes |
| `npm run test:live:matrix` | 3 roles × feed/post/question matrix |
| `npm run test:e2e` | Full API flow (Match-Feed, duel, quiz, RLS negatives) |
| `npm run test:journey` | Student + parent + teacher + e2e scripts |
| `npm run test:live:all` | All live suites (set `ZIGO_RUN_LIVE_TESTS=1`) |
| `ZIGO_RUN_LIVE_TESTS=1` | Fail instead of skip when Supabase/server missing |

**Release preflight (local):**

```powershell
npx supabase start
npm run setup:local
npm run build:safe
npm run start -- -p 3005
$env:E2E_BASE_URL="http://localhost:3005"
$env:ZIGO_RUN_LIVE_TESTS="1"
npm run test:live:all
```

**CI:** `.github/workflows/live-tests-nightly.yml` runs the live suite weekly (Mondays 03:00 UTC) and on manual dispatch.

When Supabase is offline, `test:live` and `test:live:matrix` exit 0 with `SKIP` (unless `ZIGO_RUN_LIVE_TESTS=1`).

## QA process & docs (1.4)

| Command | Purpose |
| --- | --- |
| `npm run test:release` | Release gate: repo + unit coverage + visual probe (+ live when forced) |
| `npm run test:visual` | Static visual-regression wiring probe |
| `docs/qa-coverage-map.md` | Manual checklist → auto/partial/manual mapping |
| `docs/final-acceptance-checklist.md` | Launch sign-off table |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Bug template (role, area_id, expected RLS) |

Playwright manual-QA subset: `e2e/qa-checklist.spec.ts` (student surfaces, no DM route, manifest).

**Before demo/APK:** run `npm run test:visual` + walk `docs/visual-regression-checklist.md` manually.

## Architecture & domain modules (2.1)

See `docs/domain-modules.md` for feed vs social boundaries and legacy API deprecation.

| Barrel | Submodules |
| --- | --- |
| `learning.ts` | `types`, `schemas`, `progress`, `quiz`, `awards` |
| `questions.ts` | `schemas`, `queries`, `mutations` |
| `feed.ts` | `schemas`, `types`, `queries`, `mutations` |

HTTP errors: use `respondWithDomainError` from `@/lib/domain/api-errors` (moderation 422, rate limit 429, forbidden 403).

After splitting domain files, update `readLearningDomain()` / `readSocialDomain()` in `scripts/smoke-test.mjs`.

## TypeScript & lint (2.2)

| Command | Purpose |
| --- | --- |
| `npm run audit:typescript` | No `@ts-ignore`, no explicit `any`, no deep domain imports in app/components; DB type markers |
| `npm run db:types` | Regenerate `database.types.ts` from local Supabase (skip-verify when offline) |
| `npm run lint:fix` | ESLint + import sort autofix |

ESLint enforces: `consistent-type-imports`, `no-explicit-any`, `ban-ts-comment`, `simple-import-sort`.

**Path alias rule:** `src/app` and `src/components` import domain modules via barrel (`@/lib/domain/social`), not `@/lib/domain/social/feed`.

## Performans & ölçek (2.3)

| Command / pattern | Purpose |
| --- | --- |
| `hydrateSocialPosts` batch `.in("post_id", postIds)` | Avoid N+1 like/comment/save counts |
| `getSocialFeed` + `nextCursor` | Keyset pagination (`created_at`, `id`); legacy `offset` still supported |
| `getCachedSocialFeed` + `revalidateTag(SOCIAL_FEED_CACHE_TAG)` | RSC feed cache + invalidation on post create |
| `SocialMediaFrame` `priority` prop | LCP-friendly first feed image |
| `npm run analyze` | `@next/bundle-analyzer` production bundle report |

## Bakım (2.4)

| Command | Purpose |
| --- | --- |
| `npm run audit:deps` | npm audit gate (fail on high/critical; moderate tracked quarterly) |
| `npm run audit:dead-code` | Unreferenced scripts/components scan |
| `npm run audit:maintenance` | Both maintenance audits |
| `docs/maintenance.md` | Weekly / release / quarterly cadence |
| `docs/adr/` | Architecture Decision Records |

Remove finished one-time codemods from `scripts/` or add them to `scripts/dead-code-allowlist.json`.

## Güvenlik & RLS (3.1)

| Command / doc | Purpose |
| --- | --- |
| `docs/rls-policy-inventory.md` | Table × role RLS matrix + service-role rules |
| `npm run audit:rls-inventory` | Static check: key policies exist in migrations + doc markers |
| `npm run audit:service-role` | `createAdminClient` / service key only in server allowlist |
| `npm run audit:security` | Both security audits |
| `npm run test:rls` | Static RLS smoke + inventory + service-role |
| `npm run test:live:matrix` | Live negative probes: wrong area, child scope, profile hijack |
| `npm run test:e2e` | Extended authorization negatives + API area gate |

## Auth & oturum (3.2)

| Command / doc | Purpose |
| --- | --- |
| `docs/auth-production.md` | Hosted auth env, rate limits, reCAPTCHA, cookies |
| `npm run audit:auth` | Static wiring for sign-in/up hardening |
| `ZIGO_REQUIRE_EMAIL_CONFIRM` | Email verification gate (off on local demo) |
| `ZIGO_REQUIRE_STUDENT_DOCUMENT` | Student document approval gate |
| `ZIGO_REQUIRE_RECAPTCHA` + keys | Bot protection on sign-in and sign-up |

Write endpoints rate-limited: comments, story replies, reports, questions, auth routes (IP-based brute-force guard).
