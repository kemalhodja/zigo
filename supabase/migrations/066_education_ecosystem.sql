-- Zigo Education Ecosystem: reputation, calendar/booking, matching, progress reports, urgent requests.
-- Integrates with existing lesson_requests, user_interests, child_profiles, notifications.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.lesson_request_priority as enum ('normal', 'urgent');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_status as enum ('booked', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.reputation_event_kind as enum (
    'lesson_completed',
    'positive_feedback',
    'prompt_answer'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Güven Puanı (Reputation)
-- ---------------------------------------------------------------------------

alter table public.users
  add column if not exists reputation_score int not null default 100;

alter table public.users
  drop constraint if exists users_reputation_score_check;

alter table public.users
  add constraint users_reputation_score_check check (reputation_score >= 0 and reputation_score <= 1000);

create table if not exists public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  kind public.reputation_event_kind not null,
  delta int not null,
  reference_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists reputation_events_user_id_created_at_idx
  on public.reputation_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Acil Destek — lesson_requests.priority
-- ---------------------------------------------------------------------------

alter table public.lesson_requests
  add column if not exists priority public.lesson_request_priority not null default 'normal';

create index if not exists lesson_requests_receiver_priority_status_idx
  on public.lesson_requests (receiver_id, priority, status, created_at desc);

-- Extend notification kinds for urgent lesson requests (065 baseline).
alter table public.notifications drop constraint if exists notifications_kind_check;

alter table public.notifications
  add constraint notifications_kind_check check (
    kind in (
      'like',
      'comment',
      'follow',
      'save',
      'story',
      'system',
      'lesson_request',
      'lesson_request_urgent',
      'lesson_request_accepted',
      'lesson_request_rejected',
      'lesson_request_message'
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Akıllı Takvim — Availability + Booking
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint teacher_availability_time_check check (end_time > start_time)
);

create index if not exists teacher_availability_teacher_start_idx
  on public.teacher_availability (teacher_id, start_time asc);

create index if not exists teacher_availability_open_slots_idx
  on public.teacher_availability (teacher_id, is_booked, start_time asc)
  where is_booked = false;

create table if not exists public.lesson_bookings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  parent_id uuid not null references public.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete set null,
  availability_id uuid not null unique references public.teacher_availability(id) on delete cascade,
  area_id int references public.education_areas(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.booking_status not null default 'booked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_bookings_time_check check (end_time > start_time)
);

create index if not exists lesson_bookings_parent_id_start_idx
  on public.lesson_bookings (parent_id, start_time desc);

create index if not exists lesson_bookings_teacher_id_start_idx
  on public.lesson_bookings (teacher_id, start_time desc);

-- ---------------------------------------------------------------------------
-- 4. Matching — StudentNeeds
-- ---------------------------------------------------------------------------

create table if not exists public.student_needs (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid references public.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete cascade,
  area_id int not null references public.education_areas(id) on delete cascade,
  weakness_level int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_needs_weakness_check check (weakness_level between 1 and 5),
  constraint student_needs_subject_check check (
    student_user_id is not null or child_profile_id is not null
  )
);

create index if not exists student_needs_area_id_idx
  on public.student_needs (area_id, weakness_level desc);

-- ---------------------------------------------------------------------------
-- 5. Veli Raporlama — ProgressReport
-- ---------------------------------------------------------------------------

create table if not exists public.progress_reports (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid references public.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete cascade,
  area_id int not null references public.education_areas(id) on delete cascade,
  score int not null,
  report_date date not null default current_date,
  feedback text,
  created_at timestamptz not null default now(),
  constraint progress_reports_score_check check (score between 0 and 100),
  constraint progress_reports_subject_check check (
    student_user_id is not null or child_profile_id is not null
  )
);

create index if not exists progress_reports_child_date_idx
  on public.progress_reports (child_profile_id, report_date desc);

create index if not exists progress_reports_student_date_idx
  on public.progress_reports (student_user_id, report_date desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_is_verified_teacher(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = p_user_id
      and u.role = 'teacher'
      and u.is_verified = true
  );
$$;

create or replace function public.parent_owns_child(p_child_profile_id uuid, p_parent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.child_profiles cp
    where cp.id = p_child_profile_id
      and cp.parent_id = p_parent_id
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC: record_reputation_event
-- ---------------------------------------------------------------------------

create or replace function public.record_reputation_event(
  target_user_id uuid,
  event_kind public.reputation_event_kind,
  event_delta int,
  event_actor_id uuid default null,
  event_reference_id uuid default null,
  event_note text default null
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.users;
begin
  if event_delta = 0 then
    raise exception 'reputation delta cannot be zero';
  end if;

  insert into public.reputation_events (
    user_id,
    actor_id,
    kind,
    delta,
    reference_id,
    note
  )
  values (
    target_user_id,
    event_actor_id,
    event_kind,
    event_delta,
    event_reference_id,
    event_note
  );

  update public.users
  set reputation_score = greatest(0, least(1000, reputation_score + event_delta))
  where id = target_user_id
  returning * into updated;

  if updated.id is null then
    raise exception 'user not found';
  end if;

  return updated;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: find_best_teacher — matches student_needs.area + teacher user_interests
-- ---------------------------------------------------------------------------

create or replace function public.find_best_teacher(
  for_student_user_id uuid default null,
  for_child_profile_id uuid default null,
  limit_count int default 5
)
returns table (
  teacher_id uuid,
  full_name varchar,
  reputation_score int,
  matched_area_id int,
  area_name varchar,
  weakness_level int,
  match_score numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if for_student_user_id is null and for_child_profile_id is null then
    raise exception 'student or child profile required';
  end if;

  return query
  with needs as (
    select sn.area_id, sn.weakness_level
    from public.student_needs sn
    where (
      for_student_user_id is not null
      and sn.student_user_id = for_student_user_id
    ) or (
      for_child_profile_id is not null
      and sn.child_profile_id = for_child_profile_id
    )
  ),
  ranked as (
    select
      u.id as teacher_id,
      u.full_name,
      u.reputation_score,
      ea.id as matched_area_id,
      ea.area_name,
      n.weakness_level,
      (
        u.reputation_score::numeric
        + (n.weakness_level * 10)
      ) as match_score,
      row_number() over (
        partition by n.weakness_level, ea.id
        order by u.reputation_score desc, u.full_name asc
      ) as rn
    from needs n
    join public.education_areas ea on ea.id = n.area_id
    join public.user_interests ui on ui.area_id = n.area_id
    join public.users u on u.id = ui.user_id
    where public.user_is_verified_teacher(u.id)
  )
  select
    r.teacher_id,
    r.full_name,
    r.reputation_score,
    r.matched_area_id,
    r.area_name,
    r.weakness_level,
    r.match_score
  from ranked r
  where r.rn = 1
  order by r.match_score desc, r.reputation_score desc
  limit greatest(1, least(limit_count, 20));
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: parent weekly progress summary (last 7 days)
-- ---------------------------------------------------------------------------

create or replace function public.get_parent_weekly_progress_summary(
  for_parent_id uuid,
  for_child_profile_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is distinct from for_parent_id then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'reportCount', coalesce(count(pr.id), 0),
    'averageScore', coalesce(round(avg(pr.score)::numeric, 1), 0),
    'topArea', (
      select ea.area_name
      from public.progress_reports pr2
      join public.education_areas ea on ea.id = pr2.area_id
      where pr2.report_date >= current_date - 7
        and (
          (for_child_profile_id is not null and pr2.child_profile_id = for_child_profile_id)
          or (
            for_child_profile_id is null
            and pr2.child_profile_id in (
              select cp.id from public.child_profiles cp where cp.parent_id = for_parent_id
            )
          )
        )
      group by ea.area_name
      order by avg(pr2.score) desc nulls last
      limit 1
    ),
    'completedBookings', (
      select count(*)
      from public.lesson_bookings lb
      where lb.parent_id = for_parent_id
        and lb.status = 'completed'
        and lb.start_time >= now() - interval '7 days'
        and (
          for_child_profile_id is null
          or lb.child_profile_id = for_child_profile_id
        )
    )
  )
  into result
  from public.progress_reports pr
  where pr.report_date >= current_date - 7
    and (
      (for_child_profile_id is not null and pr.child_profile_id = for_child_profile_id)
      or (
        for_child_profile_id is null
        and pr.child_profile_id in (
          select cp.id from public.child_profiles cp where cp.parent_id = for_parent_id
        )
      )
    );

  return coalesce(result, jsonb_build_object(
    'reportCount', 0,
    'averageScore', 0,
    'topArea', null,
    'completedBookings', 0
  ));
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: book_availability_slot (parent)
-- ---------------------------------------------------------------------------

create or replace function public.book_availability_slot(
  slot_id uuid,
  parent_id uuid,
  child_profile_id uuid default null,
  area_id int default null
)
returns public.lesson_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  slot public.teacher_availability;
  booking public.lesson_bookings;
begin
  if auth.uid() <> parent_id then
    raise exception 'actor mismatch';
  end if;

  if public.current_user_role() <> 'parent' then
    raise exception 'only parents can book slots';
  end if;

  if child_profile_id is not null
    and not public.parent_owns_child(child_profile_id, parent_id) then
    raise exception 'invalid child profile';
  end if;

  select * into slot
  from public.teacher_availability ta
  where ta.id = slot_id
  for update;

  if slot.id is null then
    raise exception 'slot not found';
  end if;

  if slot.is_booked then
    raise exception 'slot already booked';
  end if;

  if slot.start_time <= now() then
    raise exception 'slot in the past';
  end if;

  if not public.user_is_verified_teacher(slot.teacher_id) then
    raise exception 'teacher not verified';
  end if;

  update public.teacher_availability
  set is_booked = true
  where id = slot.id;

  insert into public.lesson_bookings (
    teacher_id,
    parent_id,
    child_profile_id,
    availability_id,
    area_id,
    start_time,
    end_time,
    status
  )
  values (
    slot.teacher_id,
    parent_id,
    child_profile_id,
    slot.id,
    area_id,
    slot.start_time,
    slot.end_time,
    'booked'
  )
  returning * into booking;

  return booking;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.reputation_events enable row level security;
alter table public.teacher_availability enable row level security;
alter table public.lesson_bookings enable row level security;
alter table public.student_needs enable row level security;
alter table public.progress_reports enable row level security;

-- reputation_events: subject reads own; inserts via RPC only
drop policy if exists "Users read own reputation events" on public.reputation_events;
create policy "Users read own reputation events"
on public.reputation_events
for select
to authenticated
using (user_id = auth.uid());

-- teacher_availability
drop policy if exists "Teachers manage own availability" on public.teacher_availability;
create policy "Teachers manage own availability"
on public.teacher_availability
for all
to authenticated
using (
  teacher_id = auth.uid()
  and public.current_user_role() = 'teacher'
)
with check (
  teacher_id = auth.uid()
  and public.current_user_role() = 'teacher'
  and public.user_is_verified_teacher(auth.uid())
);

drop policy if exists "Parents read open teacher slots" on public.teacher_availability;
create policy "Parents read open teacher slots"
on public.teacher_availability
for select
to authenticated
using (
  public.current_user_role() = 'parent'
  and is_booked = false
  and start_time > now()
  and public.user_is_verified_teacher(teacher_id)
);

-- lesson_bookings
drop policy if exists "Booking participants read" on public.lesson_bookings;
create policy "Booking participants read"
on public.lesson_bookings
for select
to authenticated
using (teacher_id = auth.uid() or parent_id = auth.uid());

drop policy if exists "Teachers update booking status" on public.lesson_bookings;
create policy "Teachers update booking status"
on public.lesson_bookings
for update
to authenticated
using (teacher_id = auth.uid() and public.current_user_role() = 'teacher')
with check (teacher_id = auth.uid());

-- student_needs
drop policy if exists "Students manage own needs" on public.student_needs;
create policy "Students manage own needs"
on public.student_needs
for all
to authenticated
using (
  student_user_id = auth.uid()
  and public.current_user_role() = 'student'
)
with check (
  student_user_id = auth.uid()
  and public.current_user_role() = 'student'
);

drop policy if exists "Parents manage child needs" on public.student_needs;
create policy "Parents manage child needs"
on public.student_needs
for all
to authenticated
using (
  child_profile_id is not null
  and public.parent_owns_child(child_profile_id, auth.uid())
)
with check (
  child_profile_id is not null
  and public.parent_owns_child(child_profile_id, auth.uid())
  and public.current_user_role() = 'parent'
);

-- progress_reports
drop policy if exists "Parents read child progress reports" on public.progress_reports;
create policy "Parents read child progress reports"
on public.progress_reports
for select
to authenticated
using (
  (child_profile_id is not null and public.parent_owns_child(child_profile_id, auth.uid()))
  or (student_user_id = auth.uid())
);

drop policy if exists "Teachers insert progress reports in assigned areas" on public.progress_reports;
create policy "Teachers insert progress reports in assigned areas"
on public.progress_reports
for insert
to authenticated
with check (
  public.current_user_role() = 'teacher'
  and public.user_is_verified_teacher(auth.uid())
  and exists (
    select 1
    from public.user_interests ui
    where ui.user_id = auth.uid()
      and ui.area_id = area_id
  )
);

-- Grants
grant select on public.reputation_events to authenticated;
grant select, insert, update, delete on public.teacher_availability to authenticated;
grant select, update on public.lesson_bookings to authenticated;
grant select, insert, update, delete on public.student_needs to authenticated;
grant select, insert on public.progress_reports to authenticated;

grant execute on function public.record_reputation_event(uuid, public.reputation_event_kind, int, uuid, uuid, text) to authenticated;
grant execute on function public.find_best_teacher(uuid, uuid, int) to authenticated;
grant execute on function public.get_parent_weekly_progress_summary(uuid, uuid) to authenticated;
grant execute on function public.book_availability_slot(uuid, uuid, uuid, int) to authenticated;

-- Extend lesson-request notification RPC for urgent priority (Acil Destek).
create or replace function public.create_lesson_request_notification(
  recipient_id uuid,
  actor_id uuid,
  request_id uuid,
  kind text,
  message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if actor_id <> auth.uid() then
    raise exception 'actor mismatch';
  end if;

  if recipient_id = actor_id then
    return;
  end if;

  if kind not in (
    'lesson_request',
    'lesson_request_urgent',
    'lesson_request_accepted',
    'lesson_request_rejected',
    'lesson_request_message'
  ) then
    raise exception 'invalid notification kind';
  end if;

  if char_length(trim(message)) < 1 or char_length(message) > 500 then
    raise exception 'invalid notification message';
  end if;

  if not exists (
    select 1
    from public.lesson_requests lr
    where lr.id = request_id
      and (
        (lr.sender_id = auth.uid() and lr.receiver_id = recipient_id)
        or (lr.receiver_id = auth.uid() and lr.sender_id = recipient_id)
      )
  ) then
    raise exception 'invalid lesson request participants';
  end if;

  insert into public.notifications (
    user_id,
    actor_id,
    kind,
    lesson_request_id,
    message
  )
  values (
    recipient_id,
    actor_id,
    kind,
    request_id,
    message
  );
end;
$$;
