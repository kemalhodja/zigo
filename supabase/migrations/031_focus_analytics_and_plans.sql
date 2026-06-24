create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  area_id int references public.education_areas(id),
  weekly_pomodoro_goal int not null default 5 check (weekly_pomodoro_goal between 1 and 21),
  primary_topic varchar(120) not null default 'Weekly focus plan',
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.study_plans enable row level security;

create policy "Students can read own study plan"
on public.study_plans
for select
to authenticated
using (user_id = auth.uid());

create policy "Students can upsert own study plan"
on public.study_plans
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.current_user_role() = 'student'
);

create policy "Students can update own study plan"
on public.study_plans
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and public.current_user_role() = 'student'
);

create or replace function public.get_active_focus_session()
returns public.focus_sessions
language sql
stable
security definer
set search_path = public
as $$
  select fs.*
  from public.focus_sessions fs
  where fs.user_id = auth.uid()
    and fs.status = 'in_progress'
  order by fs.started_at desc
  limit 1;
$$;

create or replace function public.get_student_focus_analytics()
returns table (
  completed_sessions int,
  focus_minutes_week int,
  shared_moments int,
  weekly_goal int,
  weekly_completed int,
  points_from_focus int,
  active_session_id uuid,
  active_session_started_at timestamptz,
  active_session_target_seconds int,
  active_session_topic varchar
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  week_start timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  week_start := date_trunc('week', now());

  return query
  with completed as (
    select fs.*
    from public.focus_sessions fs
    where fs.user_id = auth.uid()
      and fs.status = 'completed'
  ),
  active as (
    select fs.*
    from public.focus_sessions fs
    where fs.user_id = auth.uid()
      and fs.status = 'in_progress'
    order by fs.started_at desc
    limit 1
  ),
  plan as (
    select sp.weekly_pomodoro_goal
    from public.study_plans sp
    where sp.user_id = auth.uid()
      and sp.is_active = true
    limit 1
  )
  select
    (select count(*)::int from completed),
    coalesce((
      select sum(greatest(1, round(fs.target_seconds / 60.0)))::int
      from completed fs
      where fs.completed_at >= week_start
    ), 0),
    (
      select count(*)::int
      from public.study_moments sm
      where sm.user_id = auth.uid()
    ),
    coalesce((select weekly_pomodoro_goal from plan), 5),
    (
      select count(*)::int
      from completed fs
      where fs.completed_at >= week_start
    ),
    coalesce((
      select sum(le.points_awarded)::int
      from public.learning_events le
      where le.user_id = auth.uid()
        and le.action_type = 'focus_session'
    ), 0),
    (select id from active),
    (select started_at from active),
    (select target_seconds from active),
    (select topic_label from active);
end;
$$;

create or replace function public.upsert_study_plan(
  p_area_id int default null,
  p_weekly_pomodoro_goal int default 5,
  p_primary_topic text default 'Weekly focus plan'
)
returns public.study_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_plan public.study_plans%rowtype;
  safe_topic text;
  safe_goal int;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() <> 'student' then
    raise exception 'only students can save study plans';
  end if;

  safe_topic := left(trim(coalesce(p_primary_topic, 'Weekly focus plan')), 120);
  safe_goal := greatest(1, least(21, coalesce(p_weekly_pomodoro_goal, 5)));

  if p_area_id is not null and not exists (
    select 1
    from public.user_interests ui
    where ui.user_id = auth.uid()
      and ui.area_id = p_area_id
  ) then
    raise exception 'area not in user interests';
  end if;

  insert into public.study_plans (user_id, area_id, weekly_pomodoro_goal, primary_topic)
  values (auth.uid(), p_area_id, safe_goal, safe_topic)
  on conflict (user_id) do update
  set
    area_id = excluded.area_id,
    weekly_pomodoro_goal = excluded.weekly_pomodoro_goal,
    primary_topic = excluded.primary_topic,
    is_active = true,
    updated_at = now()
  returning * into saved_plan;

  return saved_plan;
end;
$$;

create or replace function public.get_parent_focus_overview()
returns table (
  matched_study_moments int,
  focus_minutes_in_areas int,
  latest_topic varchar,
  latest_student_name varchar,
  latest_created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with matched as (
    select
      sm.*,
      u.full_name
    from public.study_moments sm
    join public.users u on u.id = sm.user_id
    where sm.area_id in (
      select ui.area_id
      from public.user_interests ui
      where ui.user_id = auth.uid()
    )
  )
  select
    (select count(*)::int from matched),
    coalesce((select sum(duration_minutes)::int from matched where created_at >= date_trunc('week', now())), 0),
    (select topic_label from matched order by created_at desc limit 1),
    (select full_name from matched order by created_at desc limit 1),
    (select created_at from matched order by created_at desc limit 1);
$$;

grant execute on function public.get_active_focus_session() to authenticated;
grant execute on function public.get_student_focus_analytics() to authenticated;
grant execute on function public.upsert_study_plan(int, int, text) to authenticated;
grant execute on function public.get_parent_focus_overview() to authenticated;
