-- Keep Storage authorization aligned with the social-post API.
-- The previous policy only allowed verified teachers, so eligible Zigo Plus
-- students/parents reached the upload endpoint but were rejected by Storage.

drop policy if exists "Verified teachers can upload social media" on storage.objects;
drop policy if exists "Eligible publishers can upload social media" on storage.objects;

create policy "Eligible publishers can upload social media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'social-media'
  and name like (auth.uid()::text || '/%')
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and (
        u.role::text in ('education_institution', 'education_platform', 'publisher')
        or (u.role::text = 'teacher' and u.is_verified)
        or (
          u.role::text in ('student', 'parent')
          and (coalesce(u.is_premium, false) or public.current_user_has_active_zigo_plus())
        )
      )
  )
);

-- The post endpoint and the original trigger disagreed on what “daily” means.
-- Resolve Plus status from NEW.author_id (rather than auth.uid()), because the
-- endpoint can correctly use a service-role client to create the post.
create or replace function public.check_daily_post_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_post_count int;
  v_has_plus boolean;
  v_limit int;
begin
  select lower(role::text), coalesce(is_premium, false)
  into v_role, v_has_plus
  from public.users
  where id = new.author_id;

  v_has_plus := coalesce(v_has_plus, false) or exists (
    select 1
    from public.user_subscriptions us
    where us.user_id = new.author_id
      and us.tier = 'zigo_plus'
      and (us.current_period_end is null or us.current_period_end > now())
  );

  select count(*) into v_post_count
  from public.social_posts
  where author_id = new.author_id
    and created_at >= date_trunc('day', now());

  if v_role in ('student', 'parent') then
    if not v_has_plus then
      raise exception 'Paylaşım yapmak için Zigo Plus abonesi olmalısınız.' using errcode = 'P0002';
    end if;
    v_limit := 2;
  elsif v_has_plus then
    return new;
  else
    v_limit := 1;
  end if;

  if v_post_count >= v_limit then
    raise exception 'Günlük paylaşım limitinizi (%) doldurdunuz.', v_limit using errcode = 'P0001';
  end if;

  return new;
end;
$$;
