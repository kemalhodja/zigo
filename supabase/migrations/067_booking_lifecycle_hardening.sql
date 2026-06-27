-- Harden lesson booking lifecycle: atomic complete/cancel with reputation + progress report.

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

  return booking;
end;
$$;

create or replace function public.cancel_lesson_booking(
  booking_id uuid,
  actor_id uuid
)
returns public.lesson_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.lesson_bookings;
  actor_role public.user_role;
begin
  if auth.uid() is distinct from actor_id then
    raise exception 'actor mismatch';
  end if;

  select role into actor_role from public.users where id = actor_id;

  select * into booking
  from public.lesson_bookings lb
  where lb.id = booking_id
  for update;

  if booking.id is null then
    raise exception 'booking not found';
  end if;

  if booking.status <> 'booked' then
    raise exception 'booking is not active';
  end if;

  if actor_role = 'teacher' and booking.teacher_id <> actor_id then
    raise exception 'forbidden';
  end if;

  if actor_role = 'parent' and booking.parent_id <> actor_id then
    raise exception 'forbidden';
  end if;

  if actor_role not in ('teacher', 'parent') then
    raise exception 'forbidden';
  end if;

  update public.lesson_bookings
  set status = 'cancelled', updated_at = now()
  where id = booking.id
  returning * into booking;

  update public.teacher_availability
  set is_booked = false
  where id = booking.availability_id;

  return booking;
end;
$$;

grant execute on function public.complete_lesson_booking(uuid, uuid, int, text) to authenticated;
grant execute on function public.cancel_lesson_booking(uuid, uuid) to authenticated;
