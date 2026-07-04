-- Teacher creator tools (exam prep links, quizzes, sponsored posts) require Zigo Plus.

alter table public.social_posts
  add column if not exists sponsored_label varchar(255),
  add column if not exists sponsored_target_url varchar(2048);

alter table public.social_posts
  drop constraint if exists social_posts_sponsored_pair_check;

alter table public.social_posts
  add constraint social_posts_sponsored_pair_check check (
    (sponsored_label is null and sponsored_target_url is null)
    or (
      sponsored_label is not null
      and char_length(trim(sponsored_label)) >= 3
      and sponsored_target_url is not null
      and char_length(trim(sponsored_target_url)) >= 8
    )
  );

create or replace function public.social_post_requires_teacher_creator_plus(target_post public.social_posts)
returns boolean
language sql
immutable
as $$
  select
    (
      target_post.premium_prep_label is not null
      and target_post.premium_prep_url is not null
    )
    or (
      target_post.sponsored_label is not null
      and target_post.sponsored_target_url is not null
    )
    or target_post.post_type = 'quiz';
$$;

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
    not (
      (premium_prep_label is not null and premium_prep_url is not null)
      or (sponsored_label is not null and sponsored_target_url is not null)
      or post_type = 'quiz'
    )
    or public.current_user_has_active_zigo_plus()
  )
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

drop policy if exists "Verified authors can update own area social posts" on public.social_posts;

create policy "Verified authors can update own area social posts"
on public.social_posts
for update
to authenticated
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  and area_id is not null
  and public.current_user_is_verified_teacher()
  and public.current_user_has_area(area_id)
  and (
    not (
      (premium_prep_label is not null and premium_prep_url is not null)
      or (sponsored_label is not null and sponsored_target_url is not null)
      or post_type = 'quiz'
    )
    or public.current_user_has_active_zigo_plus()
  )
);

drop policy if exists "Verified teachers can create area quizzes" on public.quizzes;

create policy "Verified teachers can create area quizzes"
on public.quizzes
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and public.current_user_is_verified_teacher()
  and public.current_user_has_area(area_id)
  and public.current_user_has_active_zigo_plus()
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

  if not public.current_user_has_active_zigo_plus()
    and auth.uid() is not null
    and quiz_row.teacher_id = auth.uid()
    and not public.current_user_is_platform_admin() then
    raise exception 'premium subscription required for teacher quizzes';
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
