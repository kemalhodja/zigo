-- Parent lesson packages (Basic/Pro/Premium), live lessons (Jitsi), reminders.

create type public.lesson_package_plan_type as enum ('basic', 'pro', 'premium');
create type public.lesson_package_status as enum ('pending', 'active', 'expired', 'canceled');
create type public.live_lesson_status as enum ('scheduled', 'live', 'completed', 'canceled');

create table if not exists public.lesson_package_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status public.lesson_package_status not null default 'pending',
  plan_type public.lesson_package_plan_type not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  lessons_included int not null check (lessons_included > 0),
  lessons_used int not null default 0 check (lessons_used >= 0),
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_package_used_lte_included check (lessons_used <= lessons_included)
);

create index if not exists lesson_package_subscriptions_user_active_idx
  on public.lesson_package_subscriptions (user_id, status, ends_at desc);

create table if not exists public.live_lessons (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.lesson_bookings(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  parent_id uuid not null references public.users(id) on delete cascade,
  meeting_url text not null,
  provider text not null default 'jitsi',
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes int not null default 60 check (duration_minutes > 0),
  status public.live_lesson_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

create index if not exists live_lessons_teacher_start_idx
  on public.live_lessons (teacher_id, start_time);
create index if not exists live_lessons_parent_start_idx
  on public.live_lessons (parent_id, start_time);

create table if not exists public.lesson_reminder_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.lesson_bookings(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('24h', '1h', '15m')),
  sent_at timestamptz not null default now(),
  unique (booking_id, reminder_type)
);

alter table public.notifications
  add column if not exists lesson_booking_id uuid references public.lesson_bookings(id) on delete cascade;

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
      'lesson_request_sent',
      'lesson_request_accepted',
      'lesson_request_rejected',
      'lesson_request_message',
      'lesson_booking_confirmed',
      'lesson_reminder'
    )
  );

create or replace function public.lesson_package_lessons_for_plan(plan public.lesson_package_plan_type)
returns int
language sql
immutable
as $$
  select case plan
    when 'basic' then 2
    when 'pro' then 5
    when 'premium' then 12
  end;
$$;

create or replace function public.parent_has_active_lesson_package(for_parent_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.user_subscriptions us
    where us.user_id = for_parent_id
      and us.tier = 'zigo_plus'
      and (us.current_period_end is null or us.current_period_end > now())
  ) then
    return true;
  end if;

  return exists (
    select 1
    from public.lesson_package_subscriptions lps
    where lps.user_id = for_parent_id
      and lps.status = 'active'
      and lps.ends_at > now()
      and lps.lessons_used < lps.lessons_included
  );
end;
$$;

create or replace function public.activate_lesson_package_subscription(
  p_user_id uuid,
  p_plan_type public.lesson_package_plan_type,
  p_duration_days int default 30,
  p_stripe_checkout_session_id text default null
)
returns public.lesson_package_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.lesson_package_subscriptions;
  included int;
begin
  included := public.lesson_package_lessons_for_plan(p_plan_type);

  update public.lesson_package_subscriptions
  set status = 'expired', updated_at = now()
  where user_id = p_user_id
    and status = 'active';

  insert into public.lesson_package_subscriptions (
    user_id,
    status,
    plan_type,
    starts_at,
    ends_at,
    lessons_included,
    lessons_used,
    stripe_checkout_session_id
  )
  values (
    p_user_id,
    'active',
    p_plan_type,
    now(),
    now() + make_interval(days => greatest(p_duration_days, 1)),
    included,
    0,
    p_stripe_checkout_session_id
  )
  returning * into row;

  return row;
end;
$$;

create or replace function public.consume_lesson_package_credit(for_parent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pkg public.lesson_package_subscriptions;
begin
  if exists (
    select 1
    from public.user_subscriptions us
    where us.user_id = for_parent_id
      and us.tier = 'zigo_plus'
      and (us.current_period_end is null or us.current_period_end > now())
  ) then
    return;
  end if;

  select * into pkg
  from public.lesson_package_subscriptions lps
  where lps.user_id = for_parent_id
    and lps.status = 'active'
    and lps.ends_at > now()
    and lps.lessons_used < lps.lessons_included
  order by lps.ends_at asc
  limit 1
  for update;

  if pkg.id is null then
    raise exception 'active lesson package required';
  end if;

  update public.lesson_package_subscriptions
  set
    lessons_used = lessons_used + 1,
    updated_at = now(),
    status = case
      when lessons_used + 1 >= lessons_included then 'expired'::public.lesson_package_status
      else status
    end
  where id = pkg.id;
end;
$$;

create or replace function public.build_jitsi_meeting_url(for_booking_id uuid)
returns text
language plpgsql
immutable
as $$
declare
  room_name text;
  base_url text := coalesce(nullif(current_setting('app.jitsi_base_url', true), ''), 'https://meet.jit.si');
begin
  room_name := 'zigo-' || replace(for_booking_id::text, '-', '');
  return rtrim(base_url, '/') || '/' || room_name;
end;
$$;

create or replace function public.create_live_lesson_for_booking(target_booking_id uuid)
returns public.live_lessons
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.lesson_bookings;
  live_row public.live_lessons;
  duration_mins int;
begin
  select * into booking
  from public.lesson_bookings lb
  where lb.id = target_booking_id;

  if booking.id is null then
    raise exception 'booking not found';
  end if;

  duration_mins := greatest(
    15,
    coalesce(
      extract(epoch from (booking.end_time - booking.start_time))::int / 60,
      60
    )
  );

  insert into public.live_lessons (
    booking_id,
    teacher_id,
    parent_id,
    meeting_url,
    provider,
    start_time,
    end_time,
    duration_minutes,
    status
  )
  values (
    booking.id,
    booking.teacher_id,
    booking.parent_id,
    public.build_jitsi_meeting_url(booking.id),
    'jitsi',
    booking.start_time,
    booking.end_time,
    duration_mins,
    'scheduled'
  )
  on conflict (booking_id) do update
  set
    meeting_url = excluded.meeting_url,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    duration_minutes = excluded.duration_minutes
  returning * into live_row;

  return live_row;
end;
$$;

create or replace function public.notify_lesson_booking_confirmed(
  target_booking_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.lesson_bookings;
  live_row public.live_lessons;
  teacher_name text;
  parent_name text;
begin
  select * into booking from public.lesson_bookings where id = target_booking_id;
  if booking.id is null then return;

  select * into live_row from public.live_lessons where booking_id = target_booking_id;

  select full_name into teacher_name from public.users where id = booking.teacher_id;
  select full_name into parent_name from public.users where id = booking.parent_id;

  insert into public.notifications (user_id, actor_id, kind, lesson_booking_id, message)
  values (
    booking.parent_id,
    booking.teacher_id,
    'lesson_booking_confirmed',
    booking.id,
    coalesce(teacher_name, 'Öğretmen') || ' ile dersiniz rezerve edildi. Canlı derse katılmak için bildirimlerden veya panelden linki açın.'
  );

  insert into public.notifications (user_id, actor_id, kind, lesson_booking_id, message)
  values (
    booking.teacher_id,
    booking.parent_id,
    'lesson_booking_confirmed',
    booking.id,
    coalesce(parent_name, 'Veli') || ' ders rezervasyonu oluşturdu. Dersi başlatmak için paneldeki canlı ders linkini kullanın.'
  );
end;
$$;

create or replace function public.process_lesson_reminders(
  window_minutes int default 60
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  sent_count int := 0;
  booking_row record;
  reminder_kind text;
begin
  for booking_row in
    select lb.*, ll.meeting_url
    from public.lesson_bookings lb
    join public.live_lessons ll on ll.booking_id = lb.id
    where lb.status = 'booked'
      and lb.start_time > now()
      and lb.start_time <= now() + make_interval(mins => greatest(window_minutes, 15))
  loop
    reminder_kind := case
      when booking_row.start_time <= now() + interval '20 minutes' then '15m'
      when booking_row.start_time <= now() + interval '70 minutes' then '1h'
      else '24h'
    end;

    if exists (
      select 1 from public.lesson_reminder_log
      where booking_id = booking_row.id and reminder_type = reminder_kind
    ) then
      continue;
    end if;

    insert into public.notifications (user_id, actor_id, kind, lesson_booking_id, message)
    values
      (
        booking_row.parent_id,
        booking_row.teacher_id,
        'lesson_reminder',
        booking_row.id,
        'Canlı dersiniz yaklaşıyor. Derse katılmak için paneldeki bağlantıyı açın.'
      ),
      (
        booking_row.teacher_id,
        booking_row.parent_id,
        'lesson_reminder',
        booking_row.id,
        'Canlı dersiniz yaklaşıyor. Dersi başlatmak için paneldeki bağlantıyı açın.'
      );

    insert into public.lesson_reminder_log (booking_id, reminder_type)
    values (booking_row.id, reminder_kind);

    sent_count := sent_count + 1;
  end loop;

  return sent_count;
end;
$$;

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

  if not public.parent_has_active_lesson_package(parent_id) then
    raise exception 'active lesson package required';
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

  perform public.consume_lesson_package_credit(parent_id);
  perform public.create_live_lesson_for_booking(booking.id);
  perform public.notify_lesson_booking_confirmed(booking.id);

  return booking;
end;
$$;

alter table public.lesson_package_subscriptions enable row level security;
alter table public.live_lessons enable row level security;
alter table public.lesson_reminder_log enable row level security;

drop policy if exists "Parents read own lesson packages" on public.lesson_package_subscriptions;
create policy "Parents read own lesson packages"
on public.lesson_package_subscriptions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Participants read live lessons" on public.live_lessons;
create policy "Participants read live lessons"
on public.live_lessons
for select
to authenticated
using (teacher_id = auth.uid() or parent_id = auth.uid());

grant select on public.lesson_package_subscriptions to authenticated;
grant select on public.live_lessons to authenticated;
grant execute on function public.parent_has_active_lesson_package(uuid) to authenticated;
grant execute on function public.activate_lesson_package_subscription(uuid, public.lesson_package_plan_type, int, text) to service_role;
grant execute on function public.process_lesson_reminders(int) to service_role;
grant execute on function public.create_live_lesson_for_booking(uuid) to service_role;
