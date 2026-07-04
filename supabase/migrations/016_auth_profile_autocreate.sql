create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_full_name text;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' in ('teacher', 'parent', 'student')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
    else 'student'::public.user_role
  end;

  requested_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  insert into public.users (
    id,
    email,
    full_name,
    role,
    is_verified,
    total_points
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(requested_full_name, split_part(coalesce(new.email, 'Zigo User'), '@', 1), 'Zigo User'),
    requested_role,
    false,
    0
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
