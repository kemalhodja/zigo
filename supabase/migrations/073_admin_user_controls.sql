-- Create the account_status enum (idempotent)
do $$ begin
  create type public.account_status as enum ('active', 'suspended', 'limited', 'closed');
exception when duplicate_object then null;
end $$;

-- Add the column to users table
alter table public.users add column if not exists account_status public.account_status not null default 'active';

-- Create table for admin messages
create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title varchar(255) not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.admin_messages enable row level security;

drop policy if exists "Users can read their own messages" on public.admin_messages;
create policy "Users can read their own messages" on public.admin_messages
  for select using (auth.uid() = user_id);

-- Create RPC for updating user status securely
create or replace function public.admin_update_user_status(
  target_user_id uuid,
  new_status public.account_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'platform admin access is required';
  end if;

  update public.users
  set account_status = new_status
  where id = target_user_id;

  if not found then
    raise exception 'user not found';
  end if;
end;
$$;

grant execute on function public.admin_update_user_status(uuid, public.account_status) to authenticated;

-- Create RPC for sending a message to a user securely
create or replace function public.admin_send_user_message(
  target_user_id uuid,
  msg_title varchar,
  msg_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'platform admin access is required';
  end if;

  insert into public.admin_messages (user_id, title, body)
  values (target_user_id, msg_title, msg_body);
end;
$$;

grant execute on function public.admin_send_user_message(uuid, varchar, text) to authenticated;
