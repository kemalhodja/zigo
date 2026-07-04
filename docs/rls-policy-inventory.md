# RLS policy inventory

Row Level Security matrix for Zigo core tables (migrations **001–044**).  
Live negative probes: `npm run test:live:matrix`, `npm run test:e2e`, `npm run test:rls`.

## Legend

| Symbol | Meaning |
| --- | --- |
| **R** | `SELECT` allowed when Match-Feed / ownership rules pass |
| **C** | `INSERT` allowed |
| **U** | `UPDATE` allowed |
| **—** | Denied (RLS or API gate) |
| **RPC** | Mutations via security-definer function only |

## Core identity & interests

| Table | student | parent | teacher (verified) | platform admin |
| --- | --- | --- | --- | --- |
| `users` | R own | R own | R own + read verified teachers | R all (`006`) |
| `user_interests` | R/C own areas | R/C own areas | R assigned (admin-set, `019`/`020`) | assign via RPC |
| `education_areas` | R | R | R | R |

## Match-Feed social (`014`, `039`)

| Table | student | parent | teacher (verified) | Notes |
| --- | --- | --- | --- | --- |
| `social_posts` | R matched areas | R matched areas | R matched + C/U own in assigned areas | `current_user_has_area` |
| `post_likes` | C/R own | C/R own | C/R own | |
| `post_comments` | C own (moderated) | C own | C own | approved visible to readers |
| `saved_posts` | C/R own | C/R own | C/R own | |
| `follows` | C/R own follower | C/R own | C/R own | |
| `stories` | R matched active (`021`) | R matched | C assigned area | |
| `story_replies` | C matched stories | C matched | C matched | admin moderate (`022`) |

**Hard negatives (automated):**

- Student/parent **cannot** `INSERT` into `social_posts`.
- Teacher **cannot** post in an area outside `user_interests`.
- Reader **cannot** see posts where `area_id` ∉ their interests.

## Questions & answers (`001`, `014`)

| Table | student | parent | teacher |
| --- | --- | --- | --- |
| `questions` | R matched, C in own areas | R matched, C in own areas | R matched, — create |
| `answers` | R matched | R matched | C in assigned areas |

## Family & child scope (`003`, `033`, `042`)

| Table | student | parent | Notes |
| --- | --- | --- | --- |
| `child_profiles` | — | R/C own children | |
| `child_profile_interests` | — | R/C via own child | |
| `child_activity_events` | — | R own child's rows (`042`) | student user ≠ child profile |
| `child_activity` RPC | — | RPC award for own child | |

**Hard negative:** student cannot read another family's `child_activity_events`.

## Learning & gamification

| Table / RPC | student | parent | teacher |
| --- | --- | --- | --- |
| `learning_events` | R own | R child | — |
| `quiz_attempts` | C/R own | R child (`041`) | manage own quiz questions |
| `award_learning_points` | RPC | — | — |
| `award_reel_watch` | RPC | — | — |

## Moderation & compliance

| Table | who | Notes |
| --- | --- | --- |
| `content_reports` | authenticated create | |
| `moderation_audit_log` | platform admin R, moderator C (`023`) | |
| `blocked_keywords` | platform admin (`040`) | |
| `account_deletion_requests` | own user (`033`) | |
| `export_user_data` | RPC own user | |

## Storage (`009`)

| Bucket | read | write |
| --- | --- | --- |
| `social-media` | authenticated read | authenticated upload, owner path |

Production should review public vs signed URL strategy (`docs/video-delivery.md`).

## Service role usage

Server-only. Audited by `npm run audit:service-role`.

| Location | Purpose |
| --- | --- |
| `src/lib/supabase/admin.ts` | Factory |
| `src/app/api/billing/webhook/route.ts` | Stripe subscription sync |
| `src/lib/domain/live-gates.ts` | Setup health probes |
| `scripts/*` live tests | Seed cleanup, schema probes |

Never import `createAdminClient` from `src/components/**` or expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle.

## Related ADRs

- [0001 Match-Feed](./adr/0001-match-feed-via-user-interests.md)
- [0004 Migration baseline](./adr/0004-migration-baseline-plan.md)
