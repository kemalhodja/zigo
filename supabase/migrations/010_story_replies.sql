create table public.story_replies (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  moderation_status text not null default 'pending' check (
    moderation_status in ('pending', 'approved', 'rejected')
  ),
  created_at timestamptz not null default now()
);

create index story_replies_story_created_at_idx
on public.story_replies (story_id, created_at desc);

alter table public.story_replies enable row level security;

create policy "Users can read own story replies"
on public.story_replies
for select
to authenticated
using (user_id = auth.uid());

create policy "Story authors can read replies"
on public.story_replies
for select
to authenticated
using (
  exists (
    select 1
    from public.stories
    where stories.id = story_replies.story_id
      and stories.author_id = auth.uid()
  )
);

create policy "Users can reply to stories"
on public.story_replies
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can delete own story replies"
on public.story_replies
for delete
to authenticated
using (user_id = auth.uid());
