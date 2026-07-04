# Auth production checklist

Use before launching hosted staging or production.

## Required environment (hosted)

| Variable | Staging / production |
| --- | --- |
| `ZIGO_REQUIRE_EMAIL_CONFIRM` | `true` (default when unset) |
| `ZIGO_REQUIRE_STUDENT_DOCUMENT` | `true` for student safety gates |
| `ZIGO_REQUIRE_RECAPTCHA` | `true` when keys configured |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v3 site key |
| `RECAPTCHA_SECRET_KEY` | Server secret (never expose to client) |
| `NEXT_PUBLIC_SITE_URL` | Hosted HTTPS origin (auth redirect) |

Local Docker demo (`127.0.0.1:54321`) automatically relaxes email, student-document, and reCAPTCHA gates via `isLocalDemoSupabase()`.

## Session cookies

Supabase Auth sessions are stored through `@supabase/ssr` cookie adapters in `src/lib/supabase/server.ts`. Cookies are HttpOnly and managed by Supabase; production must run over HTTPS so Secure flags apply at the edge.

Do not store service role or anon secrets in client bundles.

## Rate limits (application layer)

| Route | Limit |
| --- | --- |
| `POST /api/auth/sign-in` | 12 / 15 min per IP |
| `POST /api/auth/sign-up` | 6 / hour per IP |
| `POST /api/social/comments` | 10 / min per user |
| `POST /api/social/stories/replies` | 10 / min per user |
| `POST /api/social/reports` | 5 / hour per user |
| `POST /api/questions` | 8 / hour per user |

Returns **429** with `Retry-After` when exceeded.

## Password policy (registration)

- Minimum 8 characters
- Blocks common passwords (`password`, `12345678`, `zigo1234`, …)
- Enforced in `POST /api/auth/sign-up` only

## reCAPTCHA

When `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_SECRET_KEY` are set and not local demo:

- Sign-up and sign-in require a valid token
- UI uses `useRecaptcha` with actions `signup` / `signin`

## Verification commands

```bash
npm run audit:auth
npm run staging:preflight
npm run test:live:matrix
```

## Supabase dashboard

1. Auth → URL configuration: add `{SITE_URL}/auth/callback`
2. Auth → Email templates: confirm signup enabled
3. Auth → Attack protection: enable Supabase rate limits as second layer
