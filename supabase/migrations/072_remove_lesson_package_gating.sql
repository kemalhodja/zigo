-- Lesson packages are not sold; parents can request/book lessons without package credits.

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

  perform public.create_live_lesson_for_booking(booking.id);
  perform public.notify_lesson_booking_confirmed(booking.id);

  return booking;
end;
$$;

create or replace function public.lesson_package_booking_gating_removed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'book_availability_slot'
      and pg_get_functiondef(p.oid) ilike '%parent_has_active_lesson_package%'
  );
$$;

grant execute on function public.lesson_package_booking_gating_removed() to service_role;
