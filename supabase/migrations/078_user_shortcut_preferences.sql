alter table public.users
  add column if not exists shortcut_preferences jsonb not null default '{}'::jsonb;

create or replace function public.update_user_shortcut_preferences(next_preferences jsonb)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.users;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if next_preferences is null or jsonb_typeof(next_preferences) <> 'object' then
    raise exception 'shortcut preferences must be a json object';
  end if;

  update public.users
  set shortcut_preferences = next_preferences
  where id = auth.uid()
  returning * into updated_profile;

  if not found then
    raise exception 'profile was not found';
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.update_user_shortcut_preferences(jsonb) to authenticated;
