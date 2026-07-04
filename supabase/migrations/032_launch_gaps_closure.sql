alter table public.user_subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end timestamptz;

alter table public.focus_sessions
  add column if not exists child_profile_id uuid references public.child_profiles(id) on delete cascade;

create index if not exists focus_sessions_child_profile_idx
on public.focus_sessions (child_profile_id, started_at desc);

create table if not exists public.study_moment_cheers (
  moment_id uuid not null references public.study_moments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, user_id)
);

alter table public.study_moment_cheers enable row level security;

drop policy if exists "Users can read study moment cheers" on public.study_moment_cheers;
drop policy if exists "Users can cheer matched study moments" on public.study_moment_cheers;

create policy "Users can read study moment cheers"
on public.study_moment_cheers
for select
to authenticated
using (true);

create policy "Users can cheer matched study moments"
on public.study_moment_cheers
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.study_moments sm
    where sm.id = moment_id
      and sm.area_id in (
        select ui.area_id
        from public.user_interests ui
        where ui.user_id = auth.uid()
      )
  )
);

alter table public.learning_events drop constraint if exists learning_events_action_type_check;

alter table public.learning_events
add constraint learning_events_action_type_check
check (action_type in ('reel_watch', 'quiz_complete', 'duel_win', 'focus_session', 'store_visit'));

drop function if exists public.start_focus_session(int, text);

create or replace function public.start_focus_session(
  p_area_id int default null,
  p_topic_label text default 'Focused study',
  p_target_seconds int default 1500,
  p_child_profile_id uuid default null
)
returns public.focus_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  created_session public.focus_sessions%rowtype;
  safe_topic text;
  safe_target int;
  actor_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  actor_role := public.current_user_role();
  safe_topic := left(trim(coalesce(p_topic_label, 'Focused study')), 120);
  safe_target := greatest(60, least(1500, coalesce(p_target_seconds, 1500)));

  if length(safe_topic) < 2 then
    raise exception 'topic label too short';
  end if;

  if p_child_profile_id is not null then
    if actor_role <> 'parent' then
      raise exception 'only parents can start child focus sessions';
    end if;

    if not exists (
      select 1
      from public.child_profiles cp
      where cp.id = p_child_profile_id
        and cp.parent_id = auth.uid()
    ) then
      raise exception 'child profile not found';
    end if;
  else
    if actor_role <> 'student' then
      raise exception 'only students can start personal focus sessions';
    end if;
  end if;

  if p_area_id is not null and not exists (
    select 1
    from public.user_interests ui
    where ui.user_id = auth.uid()
      and ui.area_id = p_area_id
  ) and p_child_profile_id is null then
    raise exception 'area not in user interests';
  end if;

  update public.focus_sessions
  set status = 'cancelled'
  where user_id = auth.uid()
    and status = 'in_progress'
    and coalesce(child_profile_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(p_child_profile_id, '00000000-0000-0000-0000-000000000000'::uuid);

  insert into public.focus_sessions (user_id, area_id, topic_label, target_seconds, child_profile_id)
  values (auth.uid(), p_area_id, safe_topic, safe_target, p_child_profile_id)
  returning * into created_session;

  return created_session;
end;
$$;

create or replace function public.complete_focus_session(
  p_session_id uuid
)
returns table (
  event_id uuid,
  points_awarded int,
  already_awarded boolean,
  total_points int,
  session_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.focus_sessions%rowtype;
  inserted_event public.learning_events%rowtype;
  current_total int;
  elapsed_seconds int;
  reward_points int := 15;
  points_target uuid;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  select * into target_session
  from public.focus_sessions
  where id = p_session_id
    and user_id = auth.uid()
  for update;

  if target_session.id is null then
    raise exception 'focus session not found';
  end if;

  if target_session.status = 'completed' then
    if target_session.child_profile_id is not null then
      select cp.total_points into current_total
      from public.child_profiles cp
      where cp.id = target_session.child_profile_id;
    else
      select users.total_points into current_total
      from public.users
      where users.id = auth.uid();
    end if;

    return query
    select null::uuid, 0, true, coalesce(current_total, 0), target_session.id;
    return;
  end if;

  if target_session.status <> 'in_progress' then
    raise exception 'focus session is not active';
  end if;

  elapsed_seconds := floor(extract(epoch from (now() - target_session.started_at)))::int;

  if elapsed_seconds < target_session.target_seconds then
    raise exception 'focus session not finished yet';
  end if;

  update public.focus_sessions
  set status = 'completed', completed_at = now(), points_awarded = reward_points
  where id = target_session.id;

  points_target := coalesce(target_session.child_profile_id, auth.uid());

  insert into public.learning_events (user_id, action_type, target_id, points_awarded)
  values (auth.uid(), 'focus_session', target_session.id, reward_points)
  on conflict (user_id, action_type, target_id) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    if target_session.child_profile_id is not null then
      select cp.total_points into current_total
      from public.child_profiles cp
      where cp.id = target_session.child_profile_id;
    else
      select users.total_points into current_total
      from public.users
      where users.id = auth.uid();
    end if;

    return query
    select null::uuid, 0, true, coalesce(current_total, 0), target_session.id;
    return;
  end if;

  if target_session.child_profile_id is not null then
    update public.child_profiles cp
    set total_points = cp.total_points + reward_points
    where cp.id = target_session.child_profile_id
      and exists (
        select 1
        from public.child_profiles owned
        where owned.id = target_session.child_profile_id
          and owned.parent_id = auth.uid()
      )
    returning cp.total_points into current_total;
  else
    update public.users profile
    set total_points = profile.total_points + reward_points
    where profile.id = auth.uid()
      and profile.role = 'student'
    returning profile.total_points into current_total;
  end if;

  return query
  select inserted_event.id, inserted_event.points_awarded, false, coalesce(current_total, 0), target_session.id;
end;
$$;

create or replace function public.record_store_visit_mission()
returns table (
  recorded boolean,
  already_recorded boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  day_key uuid;
  inserted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  day_key := md5(auth.uid()::text || current_date::text)::uuid;

  insert into public.learning_events (user_id, action_type, target_id, points_awarded)
  values (auth.uid(), 'store_visit', day_key, 1)
  on conflict (user_id, action_type, target_id) do nothing
  returning id into inserted_id;

  if inserted_id is not null then
    return query select true, false;
  else
    return query select false, true;
  end if;
end;
$$;

create or replace function public.cheer_study_moment(p_moment_id uuid)
returns table (cheer_count int)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  insert into public.study_moment_cheers (moment_id, user_id)
  values (p_moment_id, auth.uid())
  on conflict do nothing;

  return query
  select count(*)::int
  from public.study_moment_cheers smc
  where smc.moment_id = p_moment_id;
end;
$$;

drop function if exists public.get_matched_study_moments();

create or replace function public.get_matched_study_moments()
returns table (
  id uuid,
  user_id uuid,
  full_name varchar,
  area_id int,
  area_name varchar,
  topic_label varchar,
  duration_minutes int,
  caption text,
  created_at timestamptz,
  cheer_count int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sm.id,
    sm.user_id,
    u.full_name,
    sm.area_id,
    ea.area_name,
    sm.topic_label,
    sm.duration_minutes,
    sm.caption,
    sm.created_at,
    (
      select count(*)::int
      from public.study_moment_cheers smc
      where smc.moment_id = sm.id
    ) as cheer_count
  from public.study_moments sm
  join public.users u on u.id = sm.user_id
  join public.education_areas ea on ea.id = sm.area_id
  where sm.area_id in (
    select ui.area_id
    from public.user_interests ui
    where ui.user_id = auth.uid()
  )
  order by sm.created_at desc
  limit 30;
$$;

create or replace function public.get_parent_children_focus_stats()
returns table (
  child_profile_id uuid,
  display_name varchar,
  completed_sessions int,
  focus_minutes_week int,
  total_points int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cp.id,
    cp.display_name,
    count(fs.id) filter (where fs.status = 'completed')::int,
    coalesce(
      sum(
        case
          when fs.status = 'completed' and fs.completed_at >= date_trunc('week', now())
          then greatest(1, round(fs.target_seconds / 60.0))
          else 0
        end
      ),
      0
    )::int,
    cp.total_points
  from public.child_profiles cp
  left join public.focus_sessions fs on fs.child_profile_id = cp.id
  where cp.parent_id = auth.uid()
  group by cp.id, cp.display_name, cp.total_points
  order by cp.display_name;
$$;

create or replace function public.set_user_subscription_tier(
  p_user_id uuid,
  p_tier public.subscription_tier,
  p_stripe_customer_id text default null,
  p_stripe_subscription_id text default null,
  p_current_period_end timestamptz default null
)
returns public.user_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.user_subscriptions%rowtype;
begin
  if auth.uid() is not null and auth.uid() = p_user_id then
    null;
  elsif auth.uid() is not null and not exists (
    select 1 from public.platform_admins pa where pa.user_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  insert into public.user_subscriptions (
    user_id,
    tier,
    stripe_customer_id,
    stripe_subscription_id,
    current_period_end,
    updated_at
  )
  values (
    p_user_id,
    p_tier,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_current_period_end,
    now()
  )
  on conflict (user_id) do update
  set
    tier = excluded.tier,
    stripe_customer_id = coalesce(excluded.stripe_customer_id, user_subscriptions.stripe_customer_id),
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, user_subscriptions.stripe_subscription_id),
    current_period_end = coalesce(excluded.current_period_end, user_subscriptions.current_period_end),
    updated_at = now()
  returning * into saved;

  return saved;
end;
$$;

grant execute on function public.start_focus_session(int, text, int, uuid) to authenticated;
grant execute on function public.record_store_visit_mission() to authenticated;
grant execute on function public.cheer_study_moment(uuid) to authenticated;
grant execute on function public.get_parent_children_focus_stats() to authenticated;
grant execute on function public.set_user_subscription_tier(uuid, public.subscription_tier, text, text, timestamptz) to authenticated;
