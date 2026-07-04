# Product scope audit

Blueprint alignment checks for Match-Feed, safety, store, learning, and family profiles.

## Run

```bash
npm run audit:product-scope
```

Included in `test:repo:fast`.

## Coverage matrix

| Area | Audit script | Implementation |
| --- | --- | --- |
| Match-Feed | `match-feed-invariant-audit.mjs` | `user_interests` / `child_profile_interests` → `.in("area_id", …)` |
| No student DM | `no-student-dm-audit.mjs` | No `/messages` routes; gamification award disabled |
| Teacher verification | `teacher-verification-audit.mjs` | Admin verify + teacher post gates |
| Parent store approval | `store-parent-approval-audit.mjs` | RPC `parent_update_store_redemption_status` + PATCH API |
| Points economy | `store-economy-audit.mjs` | Reel +10, duel +25, no direct awards |
| Duel area safety | `duel-safety-audit.mjs` | `p_area_id` + Match-Feed check |
| Micro lesson gates | `micro-lesson-gates-audit.mjs` | 60s + verified teacher on video/reel paths |
| Quiz multi-question | `quiz-multi-flow-audit.mjs` | Migration 041 + `LearnQuizCard` stepping |
| Child profile switch | `child-profile-switch-audit.mjs` | `/profiles/select/[id]` cookie bridge |

## Migration 044

`044_product_scope_hardening.sql` adds:

- Parent approve/decline for `pending_parent_approval` redemptions
- Verified-teacher gate on `complete_video_post`
- Duel win area gate via `p_area_id`

## Related

- `docs/content-safety.md`
- `docs/operational-security.md`
- `docs/qa-coverage-map.md`
