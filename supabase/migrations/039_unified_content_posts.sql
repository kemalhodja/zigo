do $$
begin
  create type public.content_post_type as enum ('normal', 'quiz', 'micro');
exception
  when duplicate_object then null;
end $$;

alter table public.social_posts
  add column if not exists post_type public.content_post_type not null default 'normal',
  add column if not exists title varchar(255),
  add column if not exists content text,
  add column if not exists quiz_id uuid references public.quizzes(id) on delete set null,
  add column if not exists legacy_post_id uuid unique;

create index if not exists social_posts_post_type_created_at_idx
on public.social_posts (post_type, created_at desc);

create index if not exists social_posts_quiz_id_idx
on public.social_posts (quiz_id)
where quiz_id is not null;

update public.social_posts
set post_type = case
  when quiz_id is not null then 'quiz'::public.content_post_type
  when is_reel or media_type = 'video' then 'micro'::public.content_post_type
  else 'normal'::public.content_post_type
end;

insert into public.social_posts (
  author_id,
  area_id,
  caption,
  title,
  content,
  media_url,
  media_type,
  is_reel,
  post_type,
  legacy_post_id,
  created_at
)
select
  p.teacher_id,
  p.area_id,
  coalesce(
    nullif(trim(p.title), ''),
    nullif(left(trim(coalesce(p.content, '')), 2200), ''),
    'Zigo lesson'
  ),
  p.title,
  p.content,
  p.media_url,
  case when p.media_url is not null then 'video' else 'image' end,
  p.media_url is not null,
  case
    when p.media_url is not null then 'micro'::public.content_post_type
    else 'normal'::public.content_post_type
  end,
  p.id,
  p.created_at
from public.posts p
where not exists (
  select 1
  from public.social_posts sp
  where sp.legacy_post_id = p.id
);

insert into public.social_posts (
  author_id,
  area_id,
  caption,
  title,
  post_type,
  quiz_id,
  media_type,
  is_reel,
  created_at
)
select
  q.teacher_id,
  q.area_id,
  q.title,
  q.title,
  'quiz'::public.content_post_type,
  q.id,
  'image',
  false,
  q.created_at
from public.quizzes q
where q.is_active
  and not exists (
    select 1
    from public.social_posts sp
    where sp.quiz_id = q.id
  );

alter table public.social_posts
  drop constraint if exists social_posts_quiz_link_check;

alter table public.social_posts
  add constraint social_posts_quiz_link_check check (
    (post_type = 'quiz' and quiz_id is not null)
    or (post_type <> 'quiz' and quiz_id is null)
  );

alter table public.video_completions
  add column if not exists social_post_id uuid references public.social_posts(id) on delete cascade;

alter table public.video_completions
  alter column post_id drop not null;

alter table public.video_completions
  drop constraint if exists video_completions_target_check;

alter table public.video_completions
  add constraint video_completions_target_check check (
    post_id is not null or social_post_id is not null
  );

create unique index if not exists video_completions_social_user_once_idx
on public.video_completions (social_post_id, user_id)
where social_post_id is not null and user_id is not null;

create unique index if not exists video_completions_social_child_once_idx
on public.video_completions (social_post_id, child_profile_id)
where social_post_id is not null and child_profile_id is not null;

create or replace view public.post_interactions as
select
  post_id,
  user_id,
  'like'::text as interaction_type,
  created_at
from public.post_likes
union all
select
  post_id,
  user_id,
  'save'::text as interaction_type,
  created_at
from public.saved_posts
union all
select
  post_id,
  user_id,
  'comment'::text as interaction_type,
  created_at
from public.post_comments
where moderation_status = 'approved';

grant select on public.post_interactions to authenticated;

drop policy if exists "Verified teachers can create area social posts" on public.social_posts;

create policy "Verified teachers can create area social posts"
on public.social_posts
for insert
to authenticated
with check (
  author_id = auth.uid()
  and area_id is not null
  and public.current_user_is_verified_teacher()
  and public.current_user_has_area(area_id)
  and (
    post_type <> 'quiz'
    or (
      quiz_id is not null
      and exists (
        select 1
        from public.quizzes q
        where q.id = quiz_id
          and q.teacher_id = auth.uid()
          and q.area_id = social_posts.area_id
          and q.is_active
      )
    )
  )
);

create or replace function public.sync_quiz_feed_post(target_quiz_id uuid)
returns public.social_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz_row public.quizzes;
  saved_post public.social_posts;
begin
  select * into quiz_row
  from public.quizzes
  where id = target_quiz_id;

  if not found then
    raise exception 'quiz was not found';
  end if;

  if auth.uid() is not null
    and quiz_row.teacher_id <> auth.uid()
    and not public.current_user_is_platform_admin() then
    raise exception 'quiz feed post can only be synced by the quiz owner';
  end if;

  update public.social_posts
  set
    author_id = quiz_row.teacher_id,
    area_id = quiz_row.area_id,
    caption = quiz_row.title,
    title = quiz_row.title,
    post_type = 'quiz',
    media_type = 'image',
    is_reel = false
  where quiz_id = quiz_row.id
  returning * into saved_post;

  if found then
    return saved_post;
  end if;

  insert into public.social_posts (
    author_id,
    area_id,
    caption,
    title,
    post_type,
    quiz_id,
    media_type,
    is_reel
  )
  values (
    quiz_row.teacher_id,
    quiz_row.area_id,
    quiz_row.title,
    quiz_row.title,
    'quiz',
    quiz_row.id,
    'image',
    false
  )
  returning * into saved_post;

  return saved_post;
end;
$$;

grant execute on function public.sync_quiz_feed_post(uuid) to authenticated;

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

grant execute on function public.complete_video_post(uuid, int) to authenticated;

create or replace function public.complete_child_video_post(
  target_child_profile_id uuid,
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
  existing_completion public.video_completions;
  inserted_completion public.video_completions;
  target_area_id int;
begin
  if seconds_watched < 60 then
    raise exception 'at least 60 seconds must be watched';
  end if;

  if not exists (
    select 1
    from public.child_profiles cp
    where cp.id = target_child_profile_id
      and cp.parent_id = auth.uid()
  ) then
    raise exception 'child profile access is required';
  end if;

  select * into social_post
  from public.social_posts
  where id = target_post_id
    and post_type in ('micro', 'normal')
    and media_url is not null;

  if found then
    target_area_id := social_post.area_id;

    if target_area_id is null or not exists (
      select 1
      from public.child_profile_interests cpi
      where cpi.child_profile_id = target_child_profile_id
        and cpi.area_id = target_area_id
    ) then
      raise exception 'video does not match child education areas';
    end if;

    select * into existing_completion
    from public.video_completions
    where social_post_id = social_post.id
      and child_profile_id = target_child_profile_id;

    if found then
      return existing_completion;
    end if;

    insert into public.video_completions (
      social_post_id,
      child_profile_id,
      seconds_watched,
      points_awarded
    )
    values (
      social_post.id,
      target_child_profile_id,
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

    if target_area_id is null or not exists (
      select 1
      from public.child_profile_interests cpi
      where cpi.child_profile_id = target_child_profile_id
        and cpi.area_id = target_area_id
    ) then
      raise exception 'video does not match child education areas';
    end if;

    select * into existing_completion
    from public.video_completions
    where post_id = legacy_post.id
      and child_profile_id = target_child_profile_id;

    if found then
      return existing_completion;
    end if;

    insert into public.video_completions (
      post_id,
      child_profile_id,
      seconds_watched,
      points_awarded
    )
    values (
      legacy_post.id,
      target_child_profile_id,
      seconds_watched,
      10
    )
    returning * into inserted_completion;
  end if;

  update public.child_profiles
  set total_points = total_points + 10
  where id = target_child_profile_id;

  return inserted_completion;
end;
$$;

grant execute on function public.complete_child_video_post(uuid, uuid, int) to authenticated;
