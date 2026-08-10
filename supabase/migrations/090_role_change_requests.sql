-- 090_role_change_requests.sql

create table public.role_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  old_role text not null,
  requested_role text not null,
  requested_organization_type text,
  fee_amount numeric not null default 0,
  fee_paid boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'paid', 'approved', 'rejected')),
  stripe_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index role_change_requests_user_id_idx on public.role_change_requests(user_id);
create index role_change_requests_status_idx on public.role_change_requests(status);

alter table public.role_change_requests enable row level security;

create policy "Users can read their own role change requests"
on public.role_change_requests
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read all role change requests"
on public.role_change_requests
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Admins can update role change requests"
on public.role_change_requests
for update
to authenticated
using (public.current_user_is_platform_admin())
with check (public.current_user_is_platform_admin());

create or replace function public.request_role_change(
  next_role public.user_role,
  next_organization_type text default null
)
returns public.role_change_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_request public.role_change_requests;
  normalized_org text := nullif(trim(coalesce(next_organization_type, '')), '');
  current_user_role text;
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

  select role into current_user_role from public.users where id = auth.uid();
  
  if current_user_role = next_role::text then
    raise exception 'user already has this role';
  end if;

  -- Create request
  insert into public.role_change_requests (
    user_id,
    old_role,
    requested_role,
    requested_organization_type,
    status
  ) values (
    auth.uid(),
    current_user_role,
    next_role,
    normalized_org,
    'pending'
  ) returning * into inserted_request;

  return inserted_request;
end;
$$;

grant execute on function public.request_role_change(public.user_role, text) to authenticated;

-- Rewrite update_own_account_kind to either allow immediate change (if guest) OR redirect to request_role_change.

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
  current_user_role text;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  select role into current_user_role from public.users where id = auth.uid();

  -- If they already have a role (and it's not guest), they MUST go through the role change request process!
  if current_user_role is not null and current_user_role <> 'guest' and current_user_role <> next_role::text then
     raise exception 'ROLE_CHANGE_REQUIRES_PAYMENT';
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

  delete from public.user_interests where user_id = auth.uid();

  return updated_profile;
end;
$$;

-- Function for Admins to approve a role change request
create or replace function public.approve_role_change_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.role_change_requests;
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'only admins can approve role change requests';
  end if;

  select * into req from public.role_change_requests where id = request_id;

  if not found then
    raise exception 'request not found';
  end if;

  if req.status = 'approved' then
    raise exception 'request is already approved';
  end if;

  -- Update users table
  update public.users
  set
    role = req.requested_role::public.user_role,
    organization_type = req.requested_organization_type,
    is_verified = false,
    grade_level = case
      when req.requested_role = 'teacher' then null
      else grade_level
    end
  where id = req.user_id;

  -- Clear interests
  delete from public.user_interests where user_id = req.user_id;

  -- Update request status
  update public.role_change_requests
  set status = 'approved', updated_at = now()
  where id = request_id;
end;
$$;

grant execute on function public.approve_role_change_request(uuid) to authenticated;
