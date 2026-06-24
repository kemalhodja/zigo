create or replace function public.award_social_reel_watch_points(
  p_target_user_id uuid,
  p_target_id uuid,
  p_points int
)
returns table (
  event_id uuid,
  points_awarded int,
  already_awarded boolean,
  total_points int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event public.learning_events%rowtype;
  current_total int;
begin
  if auth.uid() is null or auth.uid() <> p_target_user_id then
    raise exception 'not authorized';
  end if;

  if p_points <> 10 then
    raise exception 'invalid points';
  end if;

  if not exists (
    select 1
    from public.social_posts
    join public.users on users.id = social_posts.author_id
    where social_posts.id = p_target_id
      and (social_posts.is_reel = true or social_posts.media_type = 'video')
      and social_posts.area_id is not null
      and public.current_user_has_area(social_posts.area_id)
      and users.role = 'teacher'
      and users.is_verified = true
  ) then
    raise exception 'not a verified matched reel';
  end if;

  insert into public.learning_events (user_id, action_type, target_id, points_awarded)
  values (p_target_user_id, 'reel_watch', p_target_id, 10)
  on conflict (user_id, action_type, target_id) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    select users.total_points into current_total
    from public.users
    where users.id = p_target_user_id;

    return query
    select
      null::uuid,
      0,
      true,
      coalesce(current_total, 0);
    return;
  end if;

  update public.users as profile
  set total_points = profile.total_points + 10
  where profile.id = p_target_user_id
  returning profile.total_points into current_total;

  return query
  select
    inserted_event.id,
    inserted_event.points_awarded,
    false,
    coalesce(current_total, 0);
end;
$$;
