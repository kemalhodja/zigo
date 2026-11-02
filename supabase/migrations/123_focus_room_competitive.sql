-- Migration: 123_focus_room_competitive.sql
-- Focus odalarını yarışmalı hale getirir ve kişisel odaklanma oturumu RPC'lerini esnek/hatasız hale getirir.

create table if not exists public.focus_room_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  room_slug       text not null,
  block_index     bigint not null,   -- Wall-clock senkron blok numarası
  completed_at    timestamptz not null default now(),
  points_awarded  int not null default 30,
  week_start      date not null default (date_trunc('week', now() at time zone 'UTC')::date),
  unique (user_id, room_slug, block_index)  -- Aynı blok iki kez sayılamaz
);

create index if not exists idx_frs_user_week     on public.focus_room_sessions (user_id, week_start desc);
create index if not exists idx_frs_room_week     on public.focus_room_sessions (room_slug, week_start desc);
create index if not exists idx_frs_completed_at  on public.focus_room_sessions (completed_at desc);

-- RLS
alter table public.focus_room_sessions enable row level security;

drop policy if exists "Users read own focus sessions" on public.focus_room_sessions;
create policy "Users read own focus sessions"
  on public.focus_room_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own focus sessions" on public.focus_room_sessions;
create policy "Users insert own focus sessions"
  on public.focus_room_sessions for insert
  with check (auth.uid() = user_id);

-- Oda liderlik tablosu: belirtilen oda ve haftadaki top kullanıcılar
create or replace function public.get_room_leaderboard(
  p_slug       text,
  p_week_start date default null,
  p_limit      int  default 10
)
returns table (
  user_id          uuid,
  full_name        text,
  avatar_url       text,
  blocks_completed bigint,
  total_points     bigint,
  rank             bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    frs.user_id,
    u.full_name,
    u.avatar_url,
    count(*)                    as blocks_completed,
    sum(frs.points_awarded)     as total_points,
    row_number() over (order by count(*) desc, sum(frs.points_awarded) desc) as rank
  from public.focus_room_sessions frs
  join public.users u on u.id = frs.user_id
  where frs.room_slug  = p_slug
    and frs.week_start = coalesce(p_week_start, date_trunc('week', now() at time zone 'UTC')::date)
  group by frs.user_id, u.full_name, u.avatar_url
  order by rank
  limit least(greatest(p_limit, 1), 30);
$$;

-- Tek bir blok tamamlama kaydeder (idempotent — aynı block_index tekrar çağrılırsa sessizce geçer)
create or replace function public.complete_focus_block(
  p_user_id     uuid,
  p_room_slug   text,
  p_block_index bigint
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points     int  := 30;
  v_session_id uuid := null;
begin
  insert into public.focus_room_sessions (user_id, room_slug, block_index, points_awarded, week_start)
  values (
    p_user_id,
    p_room_slug,
    p_block_index,
    v_points,
    date_trunc('week', now() at time zone 'UTC')::date
  )
  on conflict (user_id, room_slug, block_index) do nothing
  returning id into v_session_id;

  if v_session_id is not null then
    insert into public.learning_events (user_id, action_type, target_id, points_awarded)
    values (
      p_user_id,
      'focus_session',
      v_session_id,
      v_points
    )
    on conflict (user_id, action_type, target_id) do nothing;

    update public.users
    set total_points = total_points + v_points
    where id = p_user_id;
  end if;

  return json_build_object(
    'awarded', v_session_id is not null,
    'points', case when v_session_id is not null then v_points else 0 end
  );
end;
$$;

-- Kişisel odaklanma oturumu başlatma (tüm roller ve 15-60 dk süre desteği)
create or replace function public.start_focus_session(
  p_area_id          int  default null,
  p_topic_label      text default 'Odaklanma Seansı',
  p_target_seconds   int  default 1500,
  p_child_profile_id uuid default null
)
returns public.focus_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role      public.user_role;
  safe_topic      text;
  safe_target     int;
  safe_area_id    int;
  created_session public.focus_sessions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  actor_role  := public.current_user_role();
  safe_topic  := left(trim(coalesce(nullif(trim(p_topic_label), ''), 'Odaklanma Seansı')), 120);
  safe_target := greatest(60, least(3600, coalesce(p_target_seconds, 1500)));

  if length(safe_topic) < 2 then
    safe_topic := 'Odaklanma Seansı';
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
  end if;

  safe_area_id := null;
  if p_area_id is not null and exists (
    select 1 from public.education_areas ea where ea.id = p_area_id
  ) then
    safe_area_id := p_area_id;
  end if;

  update public.focus_sessions
  set status = 'cancelled'
  where user_id = auth.uid()
    and status = 'in_progress'
    and coalesce(child_profile_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(p_child_profile_id, '00000000-0000-0000-0000-000000000000'::uuid);

  insert into public.focus_sessions (user_id, area_id, topic_label, target_seconds, child_profile_id)
  values (auth.uid(), safe_area_id, safe_topic, safe_target, p_child_profile_id)
  returning * into created_session;

  return created_session;
end;
$$;

-- Kişisel odaklanma oturumu tamamlama (saat farkı veya erken tamamlama hatası olmadan)
create or replace function public.complete_focus_session(
  p_session_id uuid
)
returns table (
  event_id        uuid,
  points_awarded  int,
  already_awarded boolean,
  total_points    int,
  session_id      uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.focus_sessions%rowtype;
  inserted_event public.learning_events%rowtype;
  current_total  int;
  reward_points  int := 15;
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

  update public.focus_sessions
  set status = 'completed', completed_at = now(), points_awarded = reward_points
  where id = target_session.id;

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
    returning profile.total_points into current_total;
  end if;

  return query
  select inserted_event.id, inserted_event.points_awarded, false, coalesce(current_total, 0), target_session.id;
end;
$$;

-- Haftalık çalışma planı kaydetme (tüm roller ve alan esnekliği ile)
create or replace function public.upsert_study_plan(
  p_area_id              int  default null,
  p_weekly_pomodoro_goal int  default 5,
  p_primary_topic        text default 'Haftalık Çalışma Planı'
)
returns public.study_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_plan   public.study_plans%rowtype;
  safe_topic   text;
  safe_goal    int;
  safe_area_id int;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  safe_topic := left(trim(coalesce(nullif(trim(p_primary_topic), ''), 'Haftalık Çalışma Planı')), 120);
  safe_goal  := greatest(1, least(21, coalesce(p_weekly_pomodoro_goal, 5)));

  safe_area_id := null;
  if p_area_id is not null and exists (
    select 1 from public.education_areas ea where ea.id = p_area_id
  ) then
    safe_area_id := p_area_id;
  end if;

  insert into public.study_plans (user_id, area_id, weekly_pomodoro_goal, primary_topic)
  values (auth.uid(), safe_area_id, safe_goal, safe_topic)
  on conflict (user_id) do update
  set
    area_id              = excluded.area_id,
    weekly_pomodoro_goal = excluded.weekly_pomodoro_goal,
    primary_topic        = excluded.primary_topic,
    is_active            = true,
    updated_at           = now()
  returning * into saved_plan;

  return saved_plan;
end;
$$;

grant execute on function public.get_room_leaderboard(text, date, int) to authenticated;
grant execute on function public.complete_focus_block(uuid, text, bigint) to authenticated;
grant execute on function public.start_focus_session(int, text, int, uuid) to authenticated;
grant execute on function public.complete_focus_session(uuid) to authenticated;
grant execute on function public.upsert_study_plan(int, int, text) to authenticated;

notify pgrst, 'reload schema';
