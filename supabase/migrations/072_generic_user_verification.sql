create or replace function public.verify_user(
  target_user_id uuid,
  verified boolean
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_user public.users;
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'platform admin access is required';
  end if;

  update public.users
  set is_verified = verified
  where id = target_user_id
  returning * into updated_user;

  if not found then
    raise exception 'user profile was not found';
  end if;

  return updated_user;
end;
$$;

grant execute on function public.verify_user(uuid, boolean) to authenticated;
