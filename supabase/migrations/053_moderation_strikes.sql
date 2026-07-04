-- İhlal uyarısı: 1. kez uyar + admin bildir; 2. kez paylaşım/yorum kapat.

alter table public.users
  add column if not exists social_safety_strike_count int not null default 0
    check (social_safety_strike_count >= 0),
  add column if not exists social_interactions_blocked boolean not null default false,
  add column if not exists social_interactions_blocked_at timestamptz;

create table if not exists public.moderation_violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reason text not null check (reason in ('profanity', 'obscenity', 'bullying')),
  content_kind text not null check (
    content_kind in (
      'comment',
      'story_reply',
      'question',
      'answer',
      'social_post',
      'story',
      'bio',
      'other'
    )
  ),
  content_preview text not null check (char_length(content_preview) <= 200),
  matched_term text,
  action_taken text not null check (action_taken in ('warned', 'restricted')),
  created_at timestamptz not null default now()
);

create index if not exists moderation_violations_user_created_idx
  on public.moderation_violations (user_id, created_at desc);

create table if not exists public.moderation_admin_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  violation_id uuid not null references public.moderation_violations(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  details text not null check (char_length(details) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists moderation_admin_alerts_status_created_idx
  on public.moderation_admin_alerts (status, created_at desc);

alter table public.moderation_violations enable row level security;
alter table public.moderation_admin_alerts enable row level security;

create policy "Users can read own moderation violations"
on public.moderation_violations
for select
to authenticated
using (user_id = auth.uid());

create policy "Platform admins can read moderation violations"
on public.moderation_violations
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Platform admins can read moderation admin alerts"
on public.moderation_admin_alerts
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Platform admins can update moderation admin alerts"
on public.moderation_admin_alerts
for update
to authenticated
using (public.current_user_is_platform_admin())
with check (public.current_user_is_platform_admin());

create or replace function public.current_user_social_interactions_blocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select users.social_interactions_blocked
      from public.users
      where users.id = auth.uid()
    ),
    false
  );
$$;

grant execute on function public.current_user_social_interactions_blocked() to authenticated;

create or replace function public.record_moderation_violation(
  p_reason text,
  p_content_kind text,
  p_content_preview text,
  p_matched_term text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_strike_count int;
  v_restricted boolean := false;
  v_violation_id uuid;
  v_action text;
  v_user_name text;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_reason not in ('profanity', 'obscenity', 'bullying') then
    return jsonb_build_object('action', 'none', 'strike_count', 0, 'restricted', false);
  end if;

  update public.users
  set social_safety_strike_count = social_safety_strike_count + 1
  where id = v_user_id
  returning social_safety_strike_count, full_name into v_strike_count, v_user_name;

  if v_strike_count >= 2 then
    update public.users
    set social_interactions_blocked = true,
        social_interactions_blocked_at = now()
    where id = v_user_id;
    v_restricted := true;
    v_action := 'restricted';
  else
    v_action := 'warned';
  end if;

  insert into public.moderation_violations (
    user_id,
    reason,
    content_kind,
    content_preview,
    matched_term,
    action_taken
  )
  values (
    v_user_id,
    p_reason,
    p_content_kind,
    left(coalesce(p_content_preview, ''), 200),
    p_matched_term,
    v_action
  )
  returning id into v_violation_id;

  insert into public.moderation_admin_alerts (user_id, violation_id, reason, status, details)
  values (
    v_user_id,
    v_violation_id,
    p_reason,
    'open',
    left(
      format(
        'Kullanıcı: %s | İhlal #%s | Tür: %s | Önizleme: %s',
        coalesce(v_user_name, v_user_id::text),
        v_strike_count,
        p_content_kind,
        coalesce(p_content_preview, '')
      ),
      500
    )
  );

  return jsonb_build_object(
    'action', v_action,
    'strike_count', v_strike_count,
    'restricted', v_restricted,
    'violation_id', v_violation_id
  );
end;
$$;

grant execute on function public.record_moderation_violation(text, text, text, text) to authenticated;

insert into public.blocked_keywords (keyword, category)
values
  ('+18', 'obscenity'),
  ('18+', 'obscenity'),
  ('yetişkin içerik', 'obscenity'),
  ('yetiskin icerik', 'obscenity'),
  ('yetişkin', 'obscenity'),
  ('yetiskin', 'obscenity'),
  ('adult content', 'obscenity'),
  ('plus 18', 'obscenity')
on conflict (keyword) do update
set category = excluded.category,
    is_active = true;

-- RLS: kısıtlı kullanıcı yorum / paylaşım yapamaz
drop policy if exists "Users can comment on matched posts" on public.post_comments;

create policy "Users can comment on matched posts"
on public.post_comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and not public.current_user_social_interactions_blocked()
  and public.social_post_matches_current_user(post_id)
  and (
    (
      (select users.role from public.users where users.id = auth.uid()) = 'student'
      and moderation_status = 'pending'
    )
    or (
      (select users.role from public.users where users.id = auth.uid()) <> 'student'
      and moderation_status in ('approved', 'pending')
    )
  )
);

drop policy if exists "Users can reply to active stories" on public.story_replies;

create policy "Users can reply to active stories"
on public.story_replies
for insert
to authenticated
with check (
  user_id = auth.uid()
  and not public.current_user_social_interactions_blocked()
  and exists (
    select 1
    from public.stories
    where stories.id = story_replies.story_id
      and stories.expires_at > now()
  )
  and (
    (
      (select users.role from public.users where users.id = auth.uid()) = 'student'
      and moderation_status = 'pending'
    )
    or (
      (select users.role from public.users where users.id = auth.uid()) <> 'student'
      and moderation_status in ('approved', 'pending')
    )
  )
);

drop policy if exists "Parents and students can ask area questions" on public.questions;

create policy "Parents and students can ask area questions"
on public.questions
for insert
to authenticated
with check (
  author_id = auth.uid()
  and not public.current_user_social_interactions_blocked()
  and public.current_user_role() in ('parent', 'student')
  and public.current_user_has_area(area_id)
);

drop policy if exists "Teachers can answer assigned area questions" on public.answers;

create policy "Teachers can answer assigned area questions"
on public.answers
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and not public.current_user_social_interactions_blocked()
  and public.current_user_is_verified_teacher()
  and exists (
    select 1
    from public.questions
    where questions.id = answers.question_id
      and public.current_user_has_area(questions.area_id)
  )
);
