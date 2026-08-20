create or replace function public.current_user_email_confirmed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select true;
$$;
