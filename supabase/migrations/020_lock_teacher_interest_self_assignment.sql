create or replace function public.set_user_interests(area_ids int[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  select role
  into current_role
  from public.users
  where id = auth.uid();

  if current_role is null then
    raise exception 'profile is required before selecting areas';
  end if;

  if current_role = 'teacher' then
    raise exception 'teacher areas are assigned by platform admins';
  end if;

  delete from public.user_interests
  where user_id = auth.uid();

  insert into public.user_interests (user_id, area_id)
  select auth.uid(), education_areas.id
  from public.education_areas
  where education_areas.id = any(area_ids)
  on conflict do nothing;
end;
$$;

grant execute on function public.set_user_interests(int[]) to authenticated;
