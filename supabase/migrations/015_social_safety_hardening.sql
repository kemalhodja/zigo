create or replace function public.social_post_matches_current_user(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.social_posts
    where social_posts.id = p_post_id
      and (
        social_posts.author_id = auth.uid()
        or (
          social_posts.area_id is not null
          and public.current_user_has_area(social_posts.area_id)
        )
      )
  );
$$;

create or replace function public.user_is_verified_teacher(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where users.id = p_user_id
      and users.role = 'teacher'
      and users.is_verified = true
  );
$$;

drop policy if exists "Users can like posts" on public.post_likes;
drop policy if exists "Users can save posts" on public.saved_posts;
drop policy if exists "Users can create comments" on public.post_comments;
drop policy if exists "Users can report posts" on public.content_reports;
drop policy if exists "Users can follow accounts" on public.follows;
drop policy if exists "Users can reply to stories" on public.story_replies;
drop policy if exists "Users can create own learning events" on public.learning_events;

create policy "Users can like matched posts"
on public.post_likes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.social_post_matches_current_user(post_id)
);

create policy "Users can save matched posts"
on public.saved_posts
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.social_post_matches_current_user(post_id)
);

create policy "Users can comment on matched posts"
on public.post_comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.social_post_matches_current_user(post_id)
  and moderation_status = case
    when (select users.role from public.users where users.id = auth.uid()) = 'student'
      then 'pending'
    else 'approved'
  end
);

create policy "Users can report matched posts"
on public.content_reports
for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and public.social_post_matches_current_user(post_id)
  and status = 'open'
);

create policy "Users can follow verified teachers"
on public.follows
for insert
to authenticated
with check (
  follower_id = auth.uid()
  and public.user_is_verified_teacher(following_id)
);

create policy "Users can reply to active stories"
on public.story_replies
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.stories
    where stories.id = story_replies.story_id
      and stories.expires_at > now()
  )
  and moderation_status = case
    when (select users.role from public.users where users.id = auth.uid()) = 'student'
      then 'pending'
    else 'approved'
  end
);

create policy "Social actions can create notifications"
on public.notifications
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and user_id <> auth.uid()
  and (
    (
      kind = 'follow'
      and post_id is null
      and message = 'started following you'
      and public.user_is_verified_teacher(user_id)
    )
    or (
      kind in ('like', 'comment')
      and post_id is not null
      and message in ('liked your post', 'commented on your post')
      and exists (
        select 1
        from public.social_posts
        where social_posts.id = notifications.post_id
          and social_posts.author_id = notifications.user_id
      )
    )
  )
);

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

  update public.users
  set total_points = total_points + 10
  where users.id = p_target_user_id
  returning users.total_points into current_total;

  return query
  select
    inserted_event.id,
    inserted_event.points_awarded,
    false,
    coalesce(current_total, 0);
end;
$$;
