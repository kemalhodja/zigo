-- stories tablosuna followers_only eklentisi
alter table public.stories 
add column if not exists followers_only boolean not null default false;

-- social_posts tablosuna yeni özelliklerin eklentisi
alter table public.social_posts 
add column if not exists followers_only_comments boolean not null default false,
add column if not exists teaser_text text,
add column if not exists follower_conversion_count integer not null default 0;

create or replace function public.increment_follower_conversion(p_post_id uuid)
returns void
language sql
security definer
as $$
  update public.social_posts set follower_conversion_count = follower_conversion_count + 1 where id = p_post_id;
$$;