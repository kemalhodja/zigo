# Compliance (KVKK / GDPR-style)

Automated checks for legal surface area, data export, and account deletion (roadmap §7).

## Verification

```bash
npm run audit:compliance
```

Included in `audit:all` / `test:repo:fast`.

## Legal pages (lawyer review required before launch)

| Route | Purpose |
| --- | --- |
| `/legal/privacy` | Privacy policy (EN + TR summary) |
| `/legal/terms` | Terms of use |
| `/legal/kvkk` | KVKK disclosure (Turkey) |
| `/legal/delete-account` | Data export download + deletion request |

Footer links: `src/components/legal-footer.tsx`  
Cookie banner: `src/components/cookie-consent-banner.tsx`

**Pre-launch:** external legal review of all four pages. Automated audits only verify presence and wiring — not legal adequacy.

**Google Play:** see `docs/google-play-data-safety.md` (EN checklist) and `docs/google-play-console-tr.md` (TR copy-paste for Play Console).

## Data subject rights

| Right | Implementation |
| --- | --- |
| Access / portability | `GET /api/account/export` → `export_user_data()` RPC |
| Erasure request | `POST /api/account/delete-request` → `request_account_deletion()` RPC |
| In-app UI | `/legal/delete-account` |

Export payload keys (migration 033):

- `profile` — id, email, full_name, role, total_points, created_at
- `interests` — education area ids
- `learning_events` — last 200 events
- `child_profiles` — parent-owned child summaries
- `exported_at` — timestamp

## Database

- Migration **033** — `account_deletion_requests`, `export_user_data`, `request_account_deletion`
- RLS: users read/insert own deletion requests only

## Staging verification

```bash
npm run staging:preflight   # probes export_user_data RPC exists
npm run test:e2e            # includes account export API check when live
```

## Incident / breach

Personal data exposure → follow `docs/incident-response-runbook.md` and notify legal for KVKK 72-hour assessment.

## Related

- `docs/production-checklist.md` §5 Auth & compliance gates
- `docs/final-acceptance-checklist.md` — legal sign-off row
- `e2e/legal.spec.ts` — page load smoke
