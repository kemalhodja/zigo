do $$
begin
  create type public.subscription_tier as enum ('free', 'zigo_plus');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_subscriptions (
  user_id uuid primary key references public.users(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  updated_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  area_id int references public.education_areas(id),
  topic_label varchar(120) not null,
  target_seconds int not null default 1500 check (target_seconds > 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  points_awarded int not null default 0 check (points_awarded >= 0)
);

create index if not exists focus_sessions_user_started_idx
on public.focus_sessions (user_id, started_at desc);

create table if not exists public.study_moments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.focus_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  area_id int not null references public.education_areas(id),
  topic_label varchar(120) not null,
  duration_minutes int not null default 25 check (duration_minutes > 0),
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists study_moments_area_created_idx
on public.study_moments (area_id, created_at desc);

alter table public.learning_events drop constraint if exists learning_events_action_type_check;

alter table public.learning_events
add constraint learning_events_action_type_check
check (action_type in ('reel_watch', 'quiz_complete', 'duel_win', 'focus_session'));

alter table public.user_subscriptions enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.study_moments enable row level security;

create policy "Users can read own subscription"
on public.user_subscriptions
for select
to authenticated
using (user_id = auth.uid());

create policy "Students can read own focus sessions"
on public.focus_sessions
for select
to authenticated
using (user_id = auth.uid());

create policy "Students can create own focus sessions"
on public.focus_sessions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.current_user_role() = 'student'
);

create policy "Users can read matched study moments"
on public.study_moments
for select
to authenticated
using (
  area_id in (
    select ui.area_id
    from public.user_interests ui
    where ui.user_id = auth.uid()
  )
);

create policy "Students can share own completed focus sessions"
on public.study_moments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.current_user_role() = 'student'
  and exists (
    select 1
    from public.focus_sessions fs
    where fs.id = session_id
      and fs.user_id = auth.uid()
      and fs.status = 'completed'
  )
);

create or replace function public.start_focus_session(
  p_area_id int default null,
  p_topic_label text default 'Focused study'
)
returns public.focus_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  created_session public.focus_sessions%rowtype;
  safe_topic text;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() <> 'student' then
    raise exception 'only students can start focus sessions';
  end if;

  safe_topic := left(trim(coalesce(p_topic_label, 'Focused study')), 120);
  if length(safe_topic) < 2 then
    raise exception 'topic label too short';
  end if;

  if p_area_id is not null and not exists (
    select 1
    from public.user_interests ui
    where ui.user_id = auth.uid()
      and ui.area_id = p_area_id
  ) then
    raise exception 'area not in user interests';
  end if;

  update public.focus_sessions
  set status = 'cancelled'
  where user_id = auth.uid()
    and status = 'in_progress';

  insert into public.focus_sessions (user_id, area_id, topic_label)
  values (auth.uid(), p_area_id, safe_topic)
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
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() <> 'student' then
    raise exception 'only students can complete focus sessions';
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
    select users.total_points into current_total
    from public.users
    where users.id = auth.uid();

    return query
    select
      null::uuid,
      0,
      true,
      coalesce(current_total, 0),
      target_session.id;
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
  set
    status = 'completed',
    completed_at = now(),
    points_awarded = reward_points
  where id = target_session.id;

  insert into public.learning_events (user_id, action_type, target_id, points_awarded)
  values (auth.uid(), 'focus_session', target_session.id, reward_points)
  on conflict (user_id, action_type, target_id) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    select users.total_points into current_total
    from public.users
    where users.id = auth.uid();

    return query
    select
      null::uuid,
      0,
      true,
      coalesce(current_total, 0),
      target_session.id;
    return;
  end if;

  update public.users as profile
  set total_points = profile.total_points + reward_points
  where profile.id = auth.uid()
    and profile.role = 'student'
  returning profile.total_points into current_total;

  return query
  select
    inserted_event.id,
    inserted_event.points_awarded,
    false,
    coalesce(current_total, 0),
    target_session.id;
end;
$$;

create or replace function public.share_study_moment(
  p_session_id uuid,
  p_caption text default null
)
returns public.study_moments
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.focus_sessions%rowtype;
  created_moment public.study_moments%rowtype;
  safe_caption text;
  resolved_area_id int;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() <> 'student' then
    raise exception 'only students can share study moments';
  end if;

  select * into target_session
  from public.focus_sessions
  where id = p_session_id
    and user_id = auth.uid();

  if target_session.id is null then
    raise exception 'focus session not found';
  end if;

  if target_session.status <> 'completed' then
    raise exception 'complete the focus session before sharing';
  end if;

  resolved_area_id := target_session.area_id;

  if resolved_area_id is null then
    select ui.area_id into resolved_area_id
    from public.user_interests ui
    where ui.user_id = auth.uid()
    order by ui.area_id
    limit 1;
  end if;

  if resolved_area_id is null then
    raise exception 'select an education area before sharing';
  end if;

  safe_caption := nullif(left(trim(coalesce(p_caption, '')), 280), '');

  insert into public.study_moments (
    session_id,
    user_id,
    area_id,
    topic_label,
    duration_minutes,
    caption
  )
  values (
    target_session.id,
    auth.uid(),
    resolved_area_id,
    target_session.topic_label,
    greatest(1, round(target_session.target_seconds / 60.0)::int),
    safe_caption
  )
  on conflict (session_id) do update
  set
    caption = excluded.caption,
    created_at = now()
  returning * into created_moment;

  return created_moment;
end;
$$;

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
  created_at timestamptz
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
    sm.created_at
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

grant execute on function public.start_focus_session(int, text) to authenticated;
grant execute on function public.complete_focus_session(uuid) to authenticated;
grant execute on function public.share_study_moment(uuid, text) to authenticated;
grant execute on function public.get_matched_study_moments() to authenticated;
