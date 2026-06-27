-- Automated Stats Engine: materialized teacher_stats + subject success + booking hook.

create table if not exists public.teacher_stats (
  teacher_id uuid primary key references public.users(id) on delete cascade,
  total_lessons int not null default 0 check (total_lessons >= 0),
  total_students int not null default 0 check (total_students >= 0),
  avg_response_minutes int not null default 0 check (avg_response_minutes >= 0),
  stats_computed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_subject_success (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid references public.child_profiles(id) on delete cascade,
  student_user_id uuid references public.users(id) on delete cascade,
  area_id int not null references public.education_areas(id) on delete cascade,
  success_score numeric(5, 2) not null default 0 check (success_score >= 0 and success_score <= 100),
  completed_lessons int not null default 0 check (completed_lessons >= 0),
  updated_at timestamptz not null default now(),
  constraint student_subject_success_learner_ref check (
    child_profile_id is not null or student_user_id is not null
  )
);

create unique index if not exists student_subject_success_child_area_uidx
  on public.student_subject_success (child_profile_id, area_id)
  where child_profile_id is not null;

create unique index if not exists student_subject_success_student_area_uidx
  on public.student_subject_success (student_user_id, area_id)
  where student_user_id is not null;

create index if not exists teacher_stats_updated_idx
  on public.teacher_stats (updated_at desc);

create or replace function public.compute_teacher_avg_response_minutes(target_teacher_id uuid)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  msg_avg int;
  profile_fallback int;
begin
  with parent_first as (
    select m.request_id, min(m.created_at) as first_at
    from public.lesson_request_messages m
    join public.lesson_requests r on r.id = m.request_id
    where r.receiver_id = target_teacher_id
      and m.sender_id = r.sender_id
    group by m.request_id
  ),
  teacher_first as (
    select m.request_id, min(m.created_at) as first_at
    from public.lesson_request_messages m
    join public.lesson_requests r on r.id = m.request_id
    where r.receiver_id = target_teacher_id
      and m.sender_id = target_teacher_id
    group by m.request_id
  )
  select coalesce(
    avg(extract(epoch from (t.first_at - p.first_at)) / 60.0)::int,
    0
  )
  into msg_avg
  from parent_first p
  join teacher_first t on t.request_id = p.request_id
  where t.first_at > p.first_at;

  select response_time_minutes into profile_fallback
  from public.teacher_profile_extras
  where user_id = target_teacher_id;

  return case
    when coalesce(msg_avg, 0) > 0 then msg_avg
    else coalesce(profile_fallback, 0)
  end;
end;
$$;

create or replace function public.recompute_teacher_stats(target_teacher_id uuid)
returns public.teacher_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.teacher_stats;
  lesson_count int;
  student_count int;
  response_minutes int;
begin
  select count(*)::int into lesson_count
  from public.lesson_bookings
  where teacher_id = target_teacher_id and status = 'completed';

  select count(distinct coalesce(child_profile_id::text, parent_id::text))::int
  into student_count
  from public.lesson_bookings
  where teacher_id = target_teacher_id and status = 'completed';

  response_minutes := public.compute_teacher_avg_response_minutes(target_teacher_id);

  insert into public.teacher_stats (
    teacher_id,
    total_lessons,
    total_students,
    avg_response_minutes,
    stats_computed_at,
    updated_at
  )
  values (
    target_teacher_id,
    lesson_count,
    student_count,
    response_minutes,
    now(),
    now()
  )
  on conflict (teacher_id) do update set
    total_lessons = excluded.total_lessons,
    total_students = excluded.total_students,
    avg_response_minutes = excluded.avg_response_minutes,
    stats_computed_at = now(),
    updated_at = now()
  returning * into row;

  return row;
end;
$$;

create or replace function public.record_student_subject_success(
  target_child_profile_id uuid,
  target_student_user_id uuid,
  target_area_id int,
  lesson_progress_score int
)
returns public.student_subject_success
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.student_subject_success;
  bounded_score numeric(5, 2);
  prev_score numeric(5, 2);
  prev_count int;
begin
  bounded_score := greatest(0, least(100, coalesce(lesson_progress_score, 85)));

  if target_child_profile_id is not null then
    select success_score, completed_lessons
    into prev_score, prev_count
    from public.student_subject_success
    where child_profile_id = target_child_profile_id
      and area_id = target_area_id;

    if found then
      update public.student_subject_success
      set
        success_score = round(((prev_score * prev_count) + bounded_score) / (prev_count + 1), 2),
        completed_lessons = prev_count + 1,
        updated_at = now()
      where child_profile_id = target_child_profile_id
        and area_id = target_area_id
      returning * into row;
    else
      insert into public.student_subject_success (
        child_profile_id, area_id, success_score, completed_lessons
      )
      values (target_child_profile_id, target_area_id, bounded_score, 1)
      returning * into row;
    end if;

    return row;
  end if;

  if target_student_user_id is not null then
    select success_score, completed_lessons
    into prev_score, prev_count
    from public.student_subject_success
    where student_user_id = target_student_user_id
      and area_id = target_area_id;

    if found then
      update public.student_subject_success
      set
        success_score = round(((prev_score * prev_count) + bounded_score) / (prev_count + 1), 2),
        completed_lessons = prev_count + 1,
        updated_at = now()
      where student_user_id = target_student_user_id
        and area_id = target_area_id
      returning * into row;
    else
      insert into public.student_subject_success (
        student_user_id, area_id, success_score, completed_lessons
      )
      values (target_student_user_id, target_area_id, bounded_score, 1)
      returning * into row;
    end if;

    return row;
  end if;

  return null;
end;
$$;

create or replace function public.apply_teacher_stats_on_lesson_complete(
  target_booking_id uuid,
  lesson_progress_score int default 85
)
returns public.teacher_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.lesson_bookings;
  stats_row public.teacher_stats;
begin
  select * into booking
  from public.lesson_bookings
  where id = target_booking_id;

  if booking.id is null or booking.status <> 'completed' then
    raise exception 'completed booking required for stats engine';
  end if;

  if booking.area_id is not null then
    perform public.record_student_subject_success(
      booking.child_profile_id,
      null,
      booking.area_id,
      lesson_progress_score
    );
  end if;

  stats_row := public.recompute_teacher_stats(booking.teacher_id);
  return stats_row;
end;
$$;

-- Hook stats engine into lesson completion (extends 070).
create or replace function public.complete_lesson_booking(
  booking_id uuid,
  teacher_id uuid,
  progress_score int default 85,
  progress_feedback text default null
)
returns public.lesson_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.lesson_bookings;
begin
  if auth.uid() is distinct from teacher_id then
    raise exception 'actor mismatch';
  end if;

  if public.current_user_role() <> 'teacher' then
    raise exception 'only teachers can complete bookings';
  end if;

  select * into booking
  from public.lesson_bookings lb
  where lb.id = booking_id
    and lb.teacher_id = teacher_id
  for update;

  if booking.id is null then
    raise exception 'booking not found';
  end if;

  if booking.status <> 'booked' then
    raise exception 'booking is not active';
  end if;

  update public.lesson_bookings
  set status = 'completed', updated_at = now()
  where id = booking.id
  returning * into booking;

  perform public.record_reputation_event(
    booking.teacher_id,
    'lesson_completed',
    15,
    teacher_id,
    booking.id,
    'Lesson booking completed'
  );

  if booking.child_profile_id is not null and booking.area_id is not null then
    insert into public.progress_reports (
      child_profile_id,
      area_id,
      score,
      report_date,
      feedback
    )
    values (
      booking.child_profile_id,
      booking.area_id,
      greatest(0, least(100, progress_score)),
      current_date,
      coalesce(progress_feedback, 'Ders oturumu tamamlandı.')
    );
  end if;

  if booking.child_profile_id is not null then
    perform public.award_child_lesson_completion_reward(
      booking.child_profile_id,
      booking.id,
      teacher_id,
      15
    );
  end if;

  perform public.apply_teacher_stats_on_lesson_complete(booking.id, progress_score);

  return booking;
end;
$$;

create or replace function public.get_teacher_platform_activity_stats(target_teacher_id uuid)
returns table (
  total_completed_lessons int,
  completed_student_count int,
  avg_response_minutes int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  stats_row public.teacher_stats;
begin
  select * into stats_row
  from public.teacher_stats
  where teacher_id = target_teacher_id;

  if stats_row.teacher_id is null then
    stats_row := public.recompute_teacher_stats(target_teacher_id);
  end if;

  total_completed_lessons := stats_row.total_lessons;
  completed_student_count := stats_row.total_students;
  avg_response_minutes := stats_row.avg_response_minutes;
  return next;
end;
$$;

grant execute on function public.compute_teacher_avg_response_minutes(uuid) to authenticated, anon;
grant execute on function public.recompute_teacher_stats(uuid) to authenticated;
grant execute on function public.apply_teacher_stats_on_lesson_complete(uuid, int) to authenticated;
grant execute on function public.record_student_subject_success(uuid, uuid, int, int) to authenticated;

alter table public.teacher_stats enable row level security;
alter table public.student_subject_success enable row level security;

drop policy if exists "Anyone can read teacher stats" on public.teacher_stats;
create policy "Anyone can read teacher stats"
on public.teacher_stats for select
using (true);

drop policy if exists "Teachers read own subject success" on public.student_subject_success;
create policy "Teachers read own subject success"
on public.student_subject_success for select
using (true);

drop policy if exists "Parents read child subject success" on public.student_subject_success;
create policy "Parents read child subject success"
on public.student_subject_success for select
using (
  child_profile_id is not null
  and exists (
    select 1 from public.child_profiles cp
    where cp.id = child_profile_id
      and cp.parent_id = auth.uid()
  )
);
