# Zigo Registration MVP Setup

This app is ready only when the real Supabase project is connected. Preview mode is not a launch state.

## Required Environment

Set these values before testing registration:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, `NEXT_PUBLIC_SITE_URL` must be the deployed web URL.

Add the server-only key for automated live checks:

```bash
SUPABASE_SERVICE_ROLE_KEY=...
```

Bootstrap env quickly:

```bash
npm run setup:env
```

See `docs/supabase-quickstart.md` for the full path.

## Supabase Migrations

Apply migrations in order:

```text
001_initial_schema.sql
002_seed_education_areas.sql
003_family_child_profiles.sql
004_zigo_store.sql
005_seed_store_products.sql
006_platform_admin_ops.sql
007_learning_engine.sql
008_social_graph.sql
009_social_storage.sql
010_story_replies.sql
011_learning_events.sql
012_content_reports.sql
013_author_moderation_review.sql
014_social_match_feed_rls.sql
015_social_safety_hardening.sql
016_auth_profile_autocreate.sql
017_mvp_seed_content.sql
018_story_match_feed_rls.sql
019_admin_teacher_area_assignment.sql
020_lock_teacher_interest_self_assignment.sql
021_story_area_match_feed.sql
022_platform_admin_moderation_policies.sql
023_moderation_audit_log.sql
024_postgrest_role_grants.sql
```

## Supabase Auth Redirects

In Supabase Auth settings, set:

```text
Site URL: NEXT_PUBLIC_SITE_URL
Redirect URL: NEXT_PUBLIC_SITE_URL/auth/callback
```

The app sends new signups to `/auth/callback?next=/onboarding`.

## First Admin Bootstrap

After registering the first admin account through `/auth`, insert that user into `platform_admins`:

```sql
insert into public.platform_admins (user_id)
values ('USER_ID_FROM_PUBLIC_USERS')
on conflict (user_id) do nothing;
```

Then open `/admin` and verify teacher accounts.

## MVP Smoke Test

1. Register a student, parent, and teacher from `/auth`.
2. Confirm each row exists in `public.users` with the correct role.
3. Complete `/onboarding` for student and parent, then select at least one shared education area.
4. Add the first admin to `platform_admins`.
5. Verify the teacher from `/admin` and assign teacher areas from the admin area form.
6. Confirm the verified teacher can create posts, Micro lessons, and Sparks from `/create` only in assigned areas.
7. Confirm student and parent accounts with the same area see the teacher content on `/`, `/micro`, `/sparks`, and `/profile/[id]`.
8. Test like, save, comment, follow, story reply, report, and moderation flows.
9. Test questions from student/parent accounts and answers from the matched teacher.
10. Test learning rewards, avatar customization, Kumbara Store redemption, and admin store status updates.
11. Confirm comment/reply rate limits and moderation audit log rows.
12. Run `npm run test:smoke`, `npm run test:rls`, `npm run test:live`, `npm run test:deploy`, `npm run test:mobile`, `npm run typecheck`, and `npm run build`.
