-- Allow users to correct signup account kind (role + organization type).

create or replace function public.update_own_account_kind(
  next_role public.user_role,
  next_organization_type text default null
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.users;
  normalized_org text := nullif(trim(coalesce(next_organization_type, '')), '');
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if next_role is null then
    raise exception 'role is required';
  end if;

  if next_role <> 'teacher' and normalized_org is not null then
    raise exception 'organization type is only valid for teacher accounts';
  end if;

  if normalized_org is not null and normalized_org not in (
    'kurs', 'okul', 'egitim_kurumu', 'egitim_platformu', 'yayinevi'
  ) then
    raise exception 'invalid organization type';
  end if;

  update public.users
  set
    role = next_role,
    organization_type = case
      when next_role = 'teacher' then normalized_org
      else null
    end,
    is_verified = false,
    grade_level = case
      when next_role = 'teacher' then null
      else grade_level
    end
  where id = auth.uid()
  returning * into updated_profile;

  if not found then
    raise exception 'profile was not found';
  end if;

  -- Interests are role-scoped; clear so the user re-selects correctly.
  delete from public.user_interests where user_id = auth.uid();

  return updated_profile;
end;
$$;

grant execute on function public.update_own_account_kind(public.user_role, text) to authenticated;
