-- Keep demo / E2E accounts unblocked after moderation strike tests in local dev.

update public.users
set
  social_safety_strike_count = 0,
  social_interactions_blocked = false,
  social_interactions_blocked_at = null
where email in (
  'student@zigo.test',
  'parent@zigo.test',
  'aylin.teacher@zigo.test',
  'mert.teacher@zigo.test',
  'admin@zigo.test'
);

delete from public.moderation_admin_alerts
where user_id in (
  select id from public.users
  where email in (
    'student@zigo.test',
    'parent@zigo.test',
    'aylin.teacher@zigo.test',
    'mert.teacher@zigo.test',
    'admin@zigo.test'
  )
);

delete from public.moderation_violations
where user_id in (
  select id from public.users
  where email in (
    'student@zigo.test',
    'parent@zigo.test',
    'aylin.teacher@zigo.test',
    'mert.teacher@zigo.test',
    'admin@zigo.test'
  )
);
