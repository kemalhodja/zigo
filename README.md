# Zigo

**The Smart, Verified, and Gamified Social Feed for Education.**

Mobile-first education platform built with Next.js, Supabase, and PostgreSQL RLS. Teachers publish verified content; students learn through Match-Feed, micro lessons, quizzes, and gamification; parents supervise progress and approve rewards.

## Quick start

```bash
npm install
npm run setup:env          # copy .env.local template
npm run dev                # http://localhost:3000
```

Apply database migrations **001–044** via Supabase SQL Editor (`supabase/zigo-full-migrations.sql`) or `npm run migrations:cloud`.

## Quality gates

```bash
npm run audit:all          # full audit bundle (§5–§11)
npm run test:repo:fast     # audits + migrations + smoke + unit + lint
npm run test:ci            # CI parity: test:repo + coverage + build
npm run test:acceptance    # platform score (target ≥95)
npm run test:release       # pre-tag release gate
```

See [Quality roadmap](docs/quality-roadmap.md) for section breakdown.

## Roles

| Role | Experience |
|------|------------|
| **Teacher** | Verified posting, micro lessons, quiz creation, Q&A inbox |
| **Student** | Gamified feed, quizzes, duels, avatar, crystals |
| **Parent** | Child profiles, activity timeline, reward approvals |

## Architecture

- **Frontend:** Next.js App Router, Tailwind, PWA + Capacitor Android
- **Backend:** Supabase Auth + PostgreSQL with Row Level Security
- **Feed:** Match-Feed — posts appear only when `area_id` matches `user_interests`
- **Moderation:** Regex/keyword filter + DB triggers; AI hook ready (`ZIGO_AI_MODERATION_URL`)
- **Canonical content:** `social_posts` (legacy `/api/posts` retired)

## Key routes

| Path | Purpose |
|------|---------|
| `/` | Personalized Match-Feed |
| `/learn` | Quizzes & micro learning |
| `/family` | Parent child profiles & activity |
| `/parent` | Parent dashboard |
| `/teacher` | Teacher studio |
| `/setup` | Deploy & migration guide |
| `/readiness` | Live gates & quality score |

## Documentation

- [Quality roadmap](docs/quality-roadmap.md)
- [Production launch checklist](docs/production-checklist.md)
- [Final launch](docs/final-launch.md)
- [Completion status](docs/completion-status.md)
- [Supabase quickstart](docs/supabase-quickstart.md)
- [Vercel deploy](docs/vercel-deploy.md)

## Demo accounts (local seed)

| Email | Password | Role |
|-------|----------|------|
| `student@zigo.test` | `ZigoTest123!` | Student |
| `parent@zigo.test` | `ZigoTest123!` | Parent |
| `aylin.teacher@zigo.test` | `ZigoTest123!` | Verified teacher |

## License

Private — Eduspire / Zigo blueprint.
