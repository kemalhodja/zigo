-- Premium written prep links (Zigo Plus), grade level updates, optional student document.

alter table public.social_posts
  add column if not exists premium_prep_label varchar(255),
  add column if not exists premium_prep_url varchar(2048);

alter table public.social_posts
  drop constraint if exists social_posts_premium_prep_pair_check;

alter table public.social_posts
  add constraint social_posts_premium_prep_pair_check check (
    (premium_prep_label is null and premium_prep_url is null)
    or (
      premium_prep_label is not null
      and char_length(trim(premium_prep_label)) >= 3
      and premium_prep_url is not null
      and char_length(trim(premium_prep_url)) >= 8
    )
  );

alter table public.users
  add column if not exists grade_level varchar(50);

alter table public.child_profiles
  add column if not exists grade_level varchar(50);

create or replace function public.current_user_has_active_zigo_plus()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_subscriptions us
    where us.user_id = auth.uid()
      and us.tier = 'zigo_plus'
      and (us.current_period_end is null or us.current_period_end > now())
  );
$$;

grant execute on function public.current_user_has_active_zigo_plus() to authenticated;

create or replace function public.get_premium_prep_url(target_post_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_url text;
  viewer_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  viewer_role := public.current_user_role();
  if viewer_role not in ('student', 'parent') then
    raise exception 'only student and parent accounts can open premium prep links';
  end if;

  if not public.current_user_has_active_zigo_plus() then
    raise exception 'premium subscription required';
  end if;

  if not public.social_post_matches_current_user(target_post_id) then
    raise exception 'post is outside your Match-Feed areas';
  end if;

  select sp.premium_prep_url
  into resolved_url
  from public.social_posts sp
  where sp.id = target_post_id
    and sp.premium_prep_label is not null
    and sp.premium_prep_url is not null;

  if not found then
    raise exception 'premium prep resource was not found';
  end if;

  return resolved_url;
end;
$$;

grant execute on function public.get_premium_prep_url(uuid) to authenticated;

create or replace function public.update_user_grade_level(next_grade_level text)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.users;
  normalized_grade text := nullif(left(trim(coalesce(next_grade_level, '')), 50), '');
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() not in ('student', 'parent') then
    raise exception 'only student and parent accounts can update grade level';
  end if;

  if normalized_grade is null then
    raise exception 'grade level is required';
  end if;

  update public.users
  set grade_level = normalized_grade
  where id = auth.uid()
  returning * into updated_profile;

  if not found then
    raise exception 'profile was not found';
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.update_user_grade_level(text) to authenticated;

create or replace function public.update_child_grade_level(
  target_child_profile_id uuid,
  next_grade_level text
)
returns public.child_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_child public.child_profiles;
  normalized_grade text := nullif(left(trim(coalesce(next_grade_level, '')), 50), '');
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() <> 'parent' then
    raise exception 'only parent accounts can update child grade level';
  end if;

  if normalized_grade is null then
    raise exception 'grade level is required';
  end if;

  update public.child_profiles
  set grade_level = normalized_grade
  where id = target_child_profile_id
    and parent_id = auth.uid()
  returning * into updated_child;

  if not found then
    raise exception 'child profile was not found for this parent';
  end if;

  return updated_child;
end;
$$;

grant execute on function public.update_child_grade_level(uuid, text) to authenticated;
