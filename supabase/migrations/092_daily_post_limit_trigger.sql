create or replace function public.check_daily_post_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_post_count int;
begin
  select role::text into v_role from public.users where id = new.author_id;

  if v_role in ('student', 'teacher', 'parent', 'STUDENT', 'TEACHER', 'PARENT') then
    select count(*) into v_post_count
    from public.social_posts
    where author_id = new.author_id
      and created_at >= (now() - interval '24 hours');

    if v_post_count >= 5 then
      raise exception 'Daily post limit (5) reached for % role', v_role using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_daily_post_limit on public.social_posts;
create trigger enforce_daily_post_limit
  before insert on public.social_posts
  for each row
  execute function public.check_daily_post_limit();
