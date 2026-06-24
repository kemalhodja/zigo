create policy "Post authors can read comments on own posts"
on public.post_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.social_posts
    where social_posts.id = post_comments.post_id
      and social_posts.author_id = auth.uid()
  )
);

create policy "Post authors can moderate comments on own posts"
on public.post_comments
for update
to authenticated
using (
  exists (
    select 1
    from public.social_posts
    where social_posts.id = post_comments.post_id
      and social_posts.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.social_posts
    where social_posts.id = post_comments.post_id
      and social_posts.author_id = auth.uid()
  )
);

create policy "Story authors can moderate replies on own stories"
on public.story_replies
for update
to authenticated
using (
  exists (
    select 1
    from public.stories
    where stories.id = story_replies.story_id
      and stories.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.stories
    where stories.id = story_replies.story_id
      and stories.author_id = auth.uid()
  )
);
