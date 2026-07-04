-- Product scope hardening: parent store approvals, verified micro lessons, duel area gate.

create or replace function public.parent_update_store_redemption_status(
  target_redemption_id uuid,
  next_status public.store_redemption_status
)
returns public.store_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_redemption public.store_redemptions;
begin
  if public.current_user_role() <> 'parent' then
    raise exception 'only parent accounts can approve child reward redemptions';
  end if;

  if next_status not in ('approved', 'cancelled') then
    raise exception 'parents can only approve or cancel pending redemptions';
  end if;

  update public.store_redemptions
  set status = next_status
  where id = target_redemption_id
    and status = 'pending_parent_approval'
    and child_profile_id is not null
    and exists (
      select 1
      from public.child_profiles
      where child_profiles.id = store_redemptions.child_profile_id
        and child_profiles.parent_id = auth.uid()
    )
  returning * into updated_redemption;

  if not found then
    raise exception 'pending child redemption was not found for this parent';
  end if;

  return updated_redemption;
end;
$$;

grant execute on function public.parent_update_store_redemption_status(uuid, public.store_redemption_status) to authenticated;

drop function if exists public.award_safe_duel_win_points(uuid, uuid, int, int);

create or replace function public.complete_video_post(
  target_post_id uuid,
  seconds_watched int default 60
)
returns public.video_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  social_post public.social_posts;
  legacy_post public.posts;
  post_author public.users;
  existing_completion public.video_completions;
  inserted_completion public.video_completions;
  target_area_id int;
begin
  if public.current_user_role() <> 'student' then
    raise exception 'only student accounts can complete videos directly';
  end if;

  if seconds_watched < 60 then
    raise exception 'at least 60 seconds must be watched';
  end if;

  select * into social_post
  from public.social_posts
  where id = target_post_id
    and post_type in ('micro', 'normal')
    and media_url is not null;

  if found then
    target_area_id := social_post.area_id;

    if target_area_id is null or not public.current_user_has_area(target_area_id) then
      raise exception 'video does not match selected education areas';
    end if;

    select * into post_author
    from public.users
    where id = social_post.author_id;

    if post_author.role <> 'teacher' or post_author.is_verified is distinct from true then
      raise exception 'only verified teacher micro lessons can award watch points';
    end if;

    select * into existing_completion
    from public.video_completions
    where social_post_id = social_post.id
      and user_id = auth.uid();

    if found then
      return existing_completion;
    end if;

    insert into public.video_completions (
      social_post_id,
      user_id,
      seconds_watched,
      points_awarded
    )
    values (
      social_post.id,
      auth.uid(),
      seconds_watched,
      10
    )
    returning * into inserted_completion;
  else
    select * into legacy_post
    from public.posts
    where id = target_post_id
      and media_url is not null;

    if not found then
      raise exception 'video post was not found';
    end if;

    target_area_id := legacy_post.area_id;

    if target_area_id is null or not public.current_user_has_area(target_area_id) then
      raise exception 'video does not match selected education areas';
    end if;

    select * into post_author
    from public.users
    where id = legacy_post.teacher_id;

    if post_author.role <> 'teacher' or post_author.is_verified is distinct from true then
      raise exception 'only verified teacher micro lessons can award watch points';
    end if;

    select * into existing_completion
    from public.video_completions
    where post_id = legacy_post.id
      and user_id = auth.uid();

    if found then
      return existing_completion;
    end if;

    insert into public.video_completions (
      post_id,
      user_id,
      seconds_watched,
      points_awarded
    )
    values (
      legacy_post.id,
      auth.uid(),
      seconds_watched,
      10
    )
    returning * into inserted_completion;
  end if;

  update public.users
  set total_points = total_points + 10
  where id = auth.uid()
    and role = 'student';

  return inserted_completion;
end;
$$;

create or replace function public.award_safe_duel_win_points(
  p_target_user_id uuid,
  p_duel_id uuid,
  p_score int,
  p_total_questions int default 3,
  p_area_id int default null
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
  required_score int;
begin
  if auth.uid() is null or auth.uid() <> p_target_user_id then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() <> 'student' then
    raise exception 'only students can earn duel rewards';
  end if;

  if p_total_questions < 1 then
    raise exception 'invalid duel length';
  end if;

  if p_area_id is not null then
    if not public.current_user_has_area(p_area_id) then
      raise exception 'duel topic does not match selected education areas';
    end if;
  elsif not exists (
    select 1
    from public.user_interests
    where user_id = p_target_user_id
  ) then
    raise exception 'select education areas before earning duel rewards';
  end if;

  required_score := greatest(1, ceil(p_total_questions::numeric / 2));

  if p_score < required_score then
    raise exception 'duel score below win threshold';
  end if;

  insert into public.learning_events (user_id, action_type, target_id, points_awarded)
  values (p_target_user_id, 'duel_win', p_duel_id, 25)
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
  set total_points = profile.total_points + 25
  where profile.id = p_target_user_id
    and profile.role = 'student'
  returning profile.total_points into current_total;

  return query
  select
    inserted_event.id,
    inserted_event.points_awarded,
    false,
    coalesce(current_total, 0);
end;
$$;

grant execute on function public.award_safe_duel_win_points(uuid, uuid, int, int, int) to authenticated;
