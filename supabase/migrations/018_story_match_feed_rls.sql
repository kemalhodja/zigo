create or replace function public.story_matches_current_user(p_story_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stories
    join public.users author on author.id = stories.author_id
    where stories.id = p_story_id
      and stories.expires_at > now()
      and (
        stories.author_id = auth.uid()
        or (
          author.role = 'teacher'
          and author.is_verified = true
          and exists (
            select 1
            from public.user_interests viewer_area
            join public.user_interests author_area
              on author_area.area_id = viewer_area.area_id
            where viewer_area.user_id = auth.uid()
              and author_area.user_id = stories.author_id
          )
        )
      )
  );
$$;

drop policy if exists "Authenticated users can read active stories" on public.stories;
drop policy if exists "Users can reply to active stories" on public.story_replies;

create policy "Users can read matched active stories"
on public.stories
for select
to authenticated
using (public.story_matches_current_user(id));

create policy "Users can reply to matched active stories"
on public.story_replies
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.story_matches_current_user(story_id)
  and moderation_status = case
    when (select users.role from public.users where users.id = auth.uid()) = 'student'
      then 'pending'
    else 'approved'
  end
);

drop policy if exists "Authenticated users can read likes" on public.post_likes;
drop policy if exists "Authenticated users can read approved comments" on public.post_comments;

create policy "Users can read matched post likes"
on public.post_likes
for select
to authenticated
using (
  user_id = auth.uid()
  or public.social_post_matches_current_user(post_id)
);

create policy "Users can read approved matched comments"
on public.post_comments
for select
to authenticated
using (
  moderation_status = 'approved'
  and public.social_post_matches_current_user(post_id)
);
