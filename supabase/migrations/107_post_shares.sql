-- Real share tracking for social posts (replaces hardcoded share counts in UI)
create table if not exists public.post_shares (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_shares_post_created_at_idx
  on public.post_shares (post_id, created_at desc);

alter table public.post_shares enable row level security;

drop policy if exists "Authenticated users can read post shares" on public.post_shares;
create policy "Authenticated users can read post shares"
on public.post_shares
for select
to authenticated
using (true);

drop policy if exists "Users can share posts" on public.post_shares;
create policy "Users can share posts"
on public.post_shares
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can delete own post shares" on public.post_shares;
create policy "Users can delete own post shares"
on public.post_shares
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on public.post_shares to authenticated, service_role;
grant select on public.post_shares to anon;
