# Platform quality (§9)

Release scorecard, social shell polish, and consolidated quality gates toward 9+ platform score.

## Verification

```bash
npm run audit:platform
npm run test:acceptance    # normalized platform score (target ≥95)
npm run test:scorecard     # full weighted scorecard (target ≥90 local / ≥95 live)
```

Included in `audit:all` / `test:repo:fast`.

## Social shell standard

Zigo should feel like a modern mobile social app in the first 10 seconds — without Instagram branding.

| Check | Source |
| --- | --- |
| No "Instagram" in user-facing copy | `social-shell-audit.mjs` |
| Micro / Sparks vocabulary + `/reels` → `/micro` redirects | `zigo-vocabulary.ts`, `next.config.ts` |
| 5-tab bottom nav (Home, Search, Create/Micro slot, Micro, Profile) | `bottom-nav.tsx` |
| Skip link + legal footer | `app-shell.tsx`, `legal-footer.tsx` |
| Safe feel checklist linked from setup | `docs/safe-instagram-feel-checklist.md` |

Manual: `docs/safe-instagram-feel-checklist.md`, `docs/visual-regression-checklist.md`.

## Scorecard gates

| Gate | Command | Pass threshold |
| --- | --- | --- |
| Fast repo | `npm run test:repo:fast` | All audits + unit + lint |
| Full repo | `npm run test:repo` | + Playwright |
| Acceptance | `npm run test:acceptance` | **≥95/100** normalized |
| Scorecard | `npm run test:scorecard` | **≥90** local, **≥95** with `ZIGO_RUN_LIVE_TESTS=1` |
| Release | `npm run test:release` | scorecard + coverage + visual probe |

Health runtime probe expects `migrationTarget: 55` on `/api/setup/health`.

## Pillar map (acceptance)

- Migrations **001–044**
- KVKK export/delete, cookie consent, video CDN, push scaffold, Stripe webhook
- Full role journeys + staging preflight
- `test:repo` (+20) and `test:live` (+15) when env available

## Related

- `docs/social-polish-roadmap.md` — phased UI polish plan
- `docs/education-core.md` — learning loop (§8)
- `docs/production-readiness.md` — deploy (§6)
- `/readiness` — live gates dashboard
