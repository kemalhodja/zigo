-- Add yayınevi organization type and restore org-aware signup trigger with teacher auto-verify.

alter table public.users
  drop constraint if exists users_organization_type_check;

alter table public.users
  add constraint users_organization_type_check check (
    organization_type is null
    or organization_type in ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu', 'yayinevi')
  );

drop function if exists public.set_user_organization_type(varchar);

create or replace function public.set_user_organization_type(target_type varchar)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if target_type is not null
    and target_type not in ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu', 'yayinevi') then
    raise exception 'invalid organization type';
  end if;

  update public.users
  set organization_type = target_type
  where id = auth.uid();
end;
$$;

grant execute on function public.set_user_organization_type(varchar) to authenticated;

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
    and requested_org_type not in ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu', 'yayinevi') then
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
    (requested_role = 'teacher'),
    0
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
