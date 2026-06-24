-- Sponsored ad lifecycle, click tracking, and secure URL resolution.

alter table public.social_posts
  add column if not exists sponsored_status varchar(20),
  add column if not exists sponsored_expires_at timestamptz,
  add column if not exists sponsored_disclosure varchar(100) default 'Sponsorlu',
  add column if not exists sponsored_click_count int not null default 0;

alter table public.social_posts
  drop constraint if exists social_posts_sponsored_status_check;

alter table public.social_posts
  add constraint social_posts_sponsored_status_check check (
    sponsored_status is null
    or sponsored_status in ('active', 'paused', 'expired')
  );

alter table public.social_posts
  drop constraint if exists social_posts_sponsored_lifecycle_check;

alter table public.social_posts
  add constraint social_posts_sponsored_lifecycle_check check (
    (sponsored_label is null and sponsored_target_url is null and sponsored_status is null)
    or (
      sponsored_label is not null
      and sponsored_target_url is not null
      and sponsored_status is not null
    )
  );

create table if not exists public.sponsored_ad_clicks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists sponsored_ad_clicks_post_id_created_at_idx
  on public.sponsored_ad_clicks (post_id, created_at desc);

alter table public.sponsored_ad_clicks enable row level security;

drop policy if exists "Users can read own sponsored ad clicks" on public.sponsored_ad_clicks;
create policy "Users can read own sponsored ad clicks"
on public.sponsored_ad_clicks
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Post authors can read sponsored ad clicks" on public.sponsored_ad_clicks;
create policy "Post authors can read sponsored ad clicks"
on public.sponsored_ad_clicks
for select
to authenticated
using (
  exists (
    select 1
    from public.social_posts sp
    where sp.id = sponsored_ad_clicks.post_id
      and sp.author_id = auth.uid()
  )
);

create or replace function public.is_sponsored_ad_active(target_post public.social_posts)
returns boolean
language sql
stable
as $$
  select
    target_post.sponsored_label is not null
    and target_post.sponsored_target_url is not null
    and target_post.sponsored_status = 'active'
    and (
      target_post.sponsored_expires_at is null
      or target_post.sponsored_expires_at > now()
    );
$$;

create or replace function public.sync_sponsored_ad_metadata()
returns trigger
language plpgsql
as $$
begin
  if new.sponsored_label is not null and new.sponsored_target_url is not null then
    new.sponsored_status := coalesce(new.sponsored_status, 'active');
    new.sponsored_expires_at := coalesce(new.sponsored_expires_at, now() + interval '30 days');
    new.sponsored_disclosure := coalesce(nullif(trim(coalesce(new.sponsored_disclosure, '')), ''), 'Sponsorlu');
    new.sponsored_click_count := coalesce(new.sponsored_click_count, 0);
  else
    new.sponsored_status := null;
    new.sponsored_expires_at := null;
    new.sponsored_disclosure := 'Sponsorlu';
    new.sponsored_click_count := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_sponsored_ad_metadata on public.social_posts;
create trigger trg_sync_sponsored_ad_metadata
before insert or update of sponsored_label, sponsored_target_url, sponsored_status, sponsored_expires_at
on public.social_posts
for each row
execute function public.sync_sponsored_ad_metadata();

create or replace function public.get_sponsored_ad_url(target_post_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post public.social_posts;
  resolved_url text;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  select * into target_post
  from public.social_posts
  where id = target_post_id;

  if not found then
    raise exception 'sponsored ad was not found';
  end if;

  if not public.is_sponsored_ad_active(target_post) then
    raise exception 'sponsored ad is not active';
  end if;

  if not public.social_post_matches_current_user(target_post_id)
    and target_post.author_id <> auth.uid() then
    raise exception 'post is outside your Match-Feed areas';
  end if;

  resolved_url := target_post.sponsored_target_url;

  insert into public.sponsored_ad_clicks (post_id, user_id)
  values (target_post_id, auth.uid());

  update public.social_posts
  set sponsored_click_count = sponsored_click_count + 1
  where id = target_post_id;

  return resolved_url;
end;
$$;

grant execute on function public.is_sponsored_ad_active(public.social_posts) to authenticated;
grant execute on function public.get_sponsored_ad_url(uuid) to authenticated;

create or replace function public.list_teacher_sponsored_ads(limit_count int default 20)
returns table (
  post_id uuid,
  caption text,
  sponsored_label text,
  sponsored_status varchar,
  sponsored_expires_at timestamptz,
  sponsored_click_count int,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() <> 'teacher' then
    raise exception 'only teachers can list sponsored ads';
  end if;

  return query
  select
    sp.id,
    sp.caption,
    sp.sponsored_label,
    sp.sponsored_status,
    sp.sponsored_expires_at,
    sp.sponsored_click_count,
    sp.created_at
  from public.social_posts sp
  where sp.author_id = auth.uid()
    and sp.sponsored_label is not null
    and sp.sponsored_target_url is not null
  order by sp.created_at desc
  limit greatest(1, least(limit_count, 50));
end;
$$;

grant execute on function public.list_teacher_sponsored_ads(int) to authenticated;
