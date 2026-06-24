-- Allow teachers/parents to insert pending comments and story replies when the app
-- flags keyword or AI needsReview (students always pending per 015).

drop policy if exists "Users can comment on matched posts" on public.post_comments;

create policy "Users can comment on matched posts"
on public.post_comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.social_post_matches_current_user(post_id)
  and (
    (
      (select users.role from public.users where users.id = auth.uid()) = 'student'
      and moderation_status = 'pending'
    )
    or (
      (select users.role from public.users where users.id = auth.uid()) <> 'student'
      and moderation_status in ('approved', 'pending')
    )
  )
);

drop policy if exists "Users can reply to active stories" on public.story_replies;

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
  and (
    (
      (select users.role from public.users where users.id = auth.uid()) = 'student'
      and moderation_status = 'pending'
    )
    or (
      (select users.role from public.users where users.id = auth.uid()) <> 'student'
      and moderation_status in ('approved', 'pending')
    )
  )
);

create policy "Post authors can read reports on own posts"
on public.content_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.social_posts
    where social_posts.id = content_reports.post_id
      and social_posts.author_id = auth.uid()
  )
);

create policy "Platform admins can read all content reports"
on public.content_reports
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Post authors can update reports on own posts"
on public.content_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.social_posts
    where social_posts.id = content_reports.post_id
      and social_posts.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.social_posts
    where social_posts.id = content_reports.post_id
      and social_posts.author_id = auth.uid()
  )
);

create policy "Platform admins can update content reports"
on public.content_reports
for update
to authenticated
using (public.current_user_is_platform_admin())
with check (public.current_user_is_platform_admin());
