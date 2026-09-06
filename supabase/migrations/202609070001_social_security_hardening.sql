-- Authoritative social visibility, media access and marketplace concurrency rules.

alter table public.social_posts add column if not exists is_discoverable boolean not null default true;
update public.social_posts sp set is_discoverable = false
from public.users u where u.id = sp.author_id and u.role in ('student', 'parent');
create index if not exists social_posts_discoverable_created_idx
  on public.social_posts (created_at desc) where is_discoverable = true;

create or replace function public.enforce_social_post_visibility()
returns trigger language plpgsql security definer set search_path = public as $$
declare author_role text;
begin
  select role::text into author_role from public.users where id = new.author_id;
  if author_role in ('student', 'parent') then
    new.is_discoverable := false;
    new.target_audience := 'followers';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_social_post_visibility on public.social_posts;
create trigger enforce_social_post_visibility before insert or update of author_id, target_audience, is_discoverable
  on public.social_posts for each row execute function public.enforce_social_post_visibility();

create or replace function public.can_view_social_media(target_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.media_uploads mu
    join public.social_posts sp on sp.id = mu.post_id
    where mu.object_path = target_path and mu.status = 'attached'
      and (sp.author_id = auth.uid() or public.social_post_matches_current_user(sp.id))
  );
$$;
grant execute on function public.can_view_social_media(text) to authenticated;

create or replace function public.enforce_private_lesson_bid_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare current_count int; current_status text;
begin
  select bids_count, status into current_count, current_status
  from public.private_lesson_posts where id = new.post_id for update;
  if current_status <> 'open' or coalesce(current_count, 0) >= 5 then
    raise exception 'lesson post is closed or bid limit reached';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_private_lesson_bid_limit on public.private_lesson_bids;
create trigger enforce_private_lesson_bid_limit before insert on public.private_lesson_bids
  for each row execute function public.enforce_private_lesson_bid_limit();
