create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  area_id int references public.education_areas(id),
  caption text not null check (char_length(caption) between 1 and 2200),
  media_url text,
  media_type text not null default 'image' check (media_type in ('image', 'video', 'carousel')),
  is_reel boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.saved_posts (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  moderation_status text not null default 'pending' check (
    moderation_status in ('pending', 'approved', 'rejected')
  ),
  created_at timestamptz not null default now()
);

create table public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  media_url text,
  caption text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  kind text not null check (kind in ('like', 'comment', 'follow', 'save', 'story', 'system')),
  post_id uuid references public.social_posts(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index social_posts_created_at_idx on public.social_posts (created_at desc);
create index social_posts_author_created_at_idx on public.social_posts (author_id, created_at desc);
create index post_comments_post_created_at_idx on public.post_comments (post_id, created_at desc);
create index notifications_user_created_at_idx on public.notifications (user_id, created_at desc);
create index stories_author_expires_idx on public.stories (author_id, expires_at desc);

alter table public.social_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.follows enable row level security;
alter table public.stories enable row level security;
alter table public.notifications enable row level security;

create policy "Authenticated users can read social posts"
on public.social_posts
for select
to authenticated
using (true);

create policy "Verified teachers can create social posts"
on public.social_posts
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.current_user_is_verified_teacher()
  and (
    area_id is null
    or public.current_user_has_area(area_id)
  )
);

create policy "Authors can update own social posts"
on public.social_posts
for update
to authenticated
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  and public.current_user_is_verified_teacher()
);

create policy "Authors can delete own social posts"
on public.social_posts
for delete
to authenticated
using (author_id = auth.uid());

create policy "Authenticated users can read likes"
on public.post_likes
for select
to authenticated
using (true);

create policy "Users can like posts"
on public.post_likes
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can unlike own likes"
on public.post_likes
for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can read saved posts"
on public.saved_posts
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can save posts"
on public.saved_posts
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can unsave own posts"
on public.saved_posts
for delete
to authenticated
using (user_id = auth.uid());

create policy "Authenticated users can read approved comments"
on public.post_comments
for select
to authenticated
using (
  moderation_status = 'approved'
  or user_id = auth.uid()
);

create policy "Users can create comments"
on public.post_comments
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can delete own comments"
on public.post_comments
for delete
to authenticated
using (user_id = auth.uid());

create policy "Authenticated users can read follows"
on public.follows
for select
to authenticated
using (true);

create policy "Users can follow accounts"
on public.follows
for insert
to authenticated
with check (follower_id = auth.uid());

create policy "Users can unfollow accounts"
on public.follows
for delete
to authenticated
using (follower_id = auth.uid());

create policy "Authenticated users can read active stories"
on public.stories
for select
to authenticated
using (expires_at > now());

create policy "Verified teachers can create stories"
on public.stories
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.current_user_is_verified_teacher()
);

create policy "Authors can delete own stories"
on public.stories
for delete
to authenticated
using (author_id = auth.uid());

create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
