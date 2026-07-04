# Incident response runbook

Quick reference for Zigo production incidents. Pair with `docs/operational-security.md`.

## Roles

| Role | Responsibility |
| --- | --- |
| **Incident lead** | Triage, timeline, decision log |
| **Engineering** | Mitigate, deploy fix, rotate secrets |
| **Comms** | Internal status; parent/teacher messaging if student safety impact |

## Severity matrix

| ID | When to use | User impact | Examples |
| --- | --- | --- | --- |
| **SEV-1** | Stop-the-line | Widespread or child-safety | RLS bypass, leaked service role, mass profanity visible to students |
| **SEV-2** | Major degradation | Core loop broken | Cannot sign in, feed empty for all, billing broken |
| **SEV-3** | Partial / delayed | Workaround exists | Moderation queue backlog, slow feed, staging-only bug |

## First 15 minutes (all severities)

1. **Acknowledge** — note UTC start time in incident channel/doc.
2. **Classify** SEV-1 / 2 / 3.
3. **Check health** — `GET /api/setup/health` (migration target, env).
4. **Check dashboards** — Supabase logs (auth, RLS), Vercel errors, Stripe webhook delivery.
5. **Contain** — if secret leak suspected: rotate keys before deep debugging (see operational-security playbook).

## Playbooks

### Feed empty / 500 on home

1. Confirm Supabase project status (dashboard).
2. Verify `NEXT_PUBLIC_SUPABASE_*` on Vercel matches project.
3. Check recent migration deploy; compare `migrationTarget` from health vs repo (currently **43**).
4. Roll back Vercel deployment if regression correlated with release.

### Auth broken (sign-in loop / 401 everywhere)

1. Supabase Auth → URL configuration includes `{SITE_URL}/auth/callback`.
2. Verify `NEXT_PUBLIC_SITE_URL` matches deployed origin (HTTPS).
3. Check `ZIGO_REQUIRE_EMAIL_CONFIRM` / student document gates not blocking all users.
4. Review auth rate-limit spikes (429 on `/api/auth/sign-in`).

### Moderation queue backlog

1. `/moderation` — pending comments/replies count.
2. Assign teacher/platform admin reviewers.
3. Reports: transition `open` → `reviewing` via `PATCH /api/social/reports`.
4. If AI provider down: keyword layer still blocks; optional `ZIGO_AI_MODERATION_URL` unset fails closed on AI errors.

### Stripe / billing failure

1. Stripe Dashboard → Webhooks → recent failures.
2. Run `npm run test:stripe-webhook` with current signing secret.
3. Confirm `ZIGO_BILLING_DEV_BYPASS` is **false** on production.

### Suspected secret leak

1. Rotate affected secret immediately (table in `docs/operational-security.md`).
2. Run `npm run audit:ops` on repo; scan git history if commit suspected.
3. Review Supabase audit logs for anomalous service-role usage.
4. Document scope; KVKK notification if personal data exposure confirmed (legal review).

## Closure checklist

- [ ] Root cause documented (5 whys or equivalent)
- [ ] Fix deployed and verified on staging
- [ ] Secrets rotated if applicable
- [ ] Follow-up ticket for preventive work
- [ ] Post-incident review within 5 business days (SEV-1/2)

## Escalation contacts

Fill before launch:

| Area | Contact / channel |
| --- | --- |
| Supabase support | Dashboard ticket |
| Vercel | Team on-call |
| Stripe | Dashboard support |
| Legal / KVKK | _(internal)_ |
