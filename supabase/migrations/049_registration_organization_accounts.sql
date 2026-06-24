-- Registration-time organization accounts: metadata → profile + branch self-selection for kurumsal hesaplar.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_full_name text;
  requested_org_type varchar(32);
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' in ('teacher', 'parent', 'student')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
    else 'student'::public.user_role
  end;

  requested_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  requested_org_type := nullif(trim(coalesce(new.raw_user_meta_data ->> 'organization_type', '')), '');
  if requested_org_type is not null
    and requested_org_type not in ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu') then
    requested_org_type := null;
  end if;

  insert into public.users (
    id,
    email,
    full_name,
    role,
    organization_type,
    is_verified,
    total_points
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(requested_full_name, split_part(coalesce(new.email, 'Zigo User'), '@', 1), 'Zigo User'),
    requested_role,
    requested_org_type,
    false,
    0
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.set_user_interests(area_ids int[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role public.user_role;
  current_org_type varchar(32);
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if not public.current_user_email_confirmed() then
    raise exception 'email confirmation is required';
  end if;

  select role, organization_type
  into current_role, current_org_type
  from public.users
  where id = auth.uid();

  if current_role is null then
    raise exception 'profile is required before selecting areas';
  end if;

  if current_role = 'teacher' and current_org_type is null then
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
