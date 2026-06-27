-- Reward child profile when a live lesson booking is completed (points + activity + badge + parent alert).

alter table public.child_activity_events
  drop constraint if exists child_activity_events_activity_type_check;

alter table public.child_activity_events
  add constraint child_activity_events_activity_type_check check (
    activity_type in (
      'micro_video_watched',
      'mini_quiz_completed',
      'duel_won',
      'lesson_completed'
    )
  );

create or replace function public.award_child_lesson_completion_reward(
  target_child_profile_id uuid,
  target_booking_id uuid,
  teacher_id uuid,
  points_to_add int default 15
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.lesson_bookings;
  child_name text;
begin
  select * into booking
  from public.lesson_bookings lb
  where lb.id = target_booking_id
    and lb.status = 'completed'
    and lb.child_profile_id = target_child_profile_id
    and lb.teacher_id = teacher_id;

  if booking.id is null then
    raise exception 'completed booking not found for child reward';
  end if;

  if exists (
    select 1
    from public.child_activity_events cae
    where cae.child_profile_id = target_child_profile_id
      and cae.activity_type = 'lesson_completed'
      and cae.metadata ->> 'booking_id' = target_booking_id::text
  ) then
    return;
  end if;

  select cp.display_name into child_name
  from public.child_profiles cp
  where cp.id = target_child_profile_id;

  update public.child_profiles
  set
    total_points = total_points + greatest(points_to_add, 0),
    avatar_assets = coalesce(avatar_assets, '{}'::jsonb)
      || jsonb_build_object('achievement_live_lesson', true)
      || case
        when coalesce(avatar_assets ->> 'frame', '') = ''
          then jsonb_build_object('frame', 'lesson_star')
        else '{}'::jsonb
      end
  where id = target_child_profile_id;

  insert into public.child_activity_events (
    child_profile_id,
    activity_type,
    title,
    points_awarded,
    metadata
  )
  values (
    target_child_profile_id,
    'lesson_completed',
    coalesce(child_name, 'Çocuğun') || ' canlı dersi tamamladı',
    greatest(points_to_add, 0),
    jsonb_build_object(
      'booking_id', target_booking_id,
      'teacher_id', teacher_id,
      'area_id', booking.area_id,
      'badge', 'lesson_star'
    )
  );

  insert into public.notifications (
    user_id,
    actor_id,
    kind,
    message
  )
  values (
    booking.parent_id,
    teacher_id,
    'system',
    coalesce(child_name, 'Çocuğun') || ' canlı dersi tamamladı. +' || greatest(points_to_add, 0)::text || ' gelişim puanı kazandı!'
  );
end;
$$;

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

  return booking;
end;
$$;

grant execute on function public.award_child_lesson_completion_reward(uuid, uuid, uuid, int) to authenticated;
grant execute on function public.complete_lesson_booking(uuid, uuid, int, text) to authenticated;
