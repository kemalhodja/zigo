create or replace function public.social_post_matches_current_user(p_post_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select exists (
      select 1
      from public.social_posts
      where social_posts.id = p_post_id
    );
  $$;
