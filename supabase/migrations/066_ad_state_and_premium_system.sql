-- Ad State Management System
-- Adds ad-free and premium subscription fields to users table

-- Add ad state columns to users table
alter table public.users
  add column if not exists ad_free_until timestamptz,
  add column if not exists is_premium boolean default false;

-- Create index for efficient ad state queries
create index if not exists users_ad_free_until_idx
  on public.users (ad_free_until)
  where ad_free_until > now();

create index if not exists users_is_premium_idx
  on public.users (is_premium)
  where is_premium = true;

-- Function to check if user has ad-free access
create or replace function public.is_user_ad_free(target_user_id uuid)
returns boolean
language sql
stable
as $$
  select
    exists (
      select 1
      from public.users
      where id = target_user_id
        and (
          is_premium = true
          or ad_free_until > now()
        )
    );
$$;

-- Function to grant ad-free time (used when user watches rewarded ad)
create or replace function public.grant_ad_free_time(target_user_id uuid, hours_to_add int default 2)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  -- Users can only grant ad-free time to themselves
  if auth.uid() != target_user_id then
    raise exception 'can only modify own ad state';
  end if;

  update public.users
  set ad_free_until = greatest(
    coalesce(ad_free_until, now()),
    now()
  ) + (hours_to_add || ' hours')::interval
  where id = target_user_id;
end;
$$;

-- Function to downgrade from premium to ad-supported after trial
create or replace function public.downgrade_from_premium(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  -- Only allow self or platform admin (admin check would be via custom claim)
  if auth.uid() != target_user_id then
    raise exception 'can only modify own ad state';
  end if;

  update public.users
  set 
    is_premium = false,
    -- Keep existing ad_free_until if it extends beyond now, otherwise clear it
    ad_free_until = case 
      when ad_free_until > now() then ad_free_until
      else null
    end
  where id = target_user_id;
end;
$$;

-- Function to upgrade user to premium
create or replace function public.upgrade_to_premium(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  -- Only allow self or platform admin
  if auth.uid() != target_user_id then
    raise exception 'can only modify own ad state';
  end if;

  update public.users
  set 
    is_premium = true,
    ad_free_until = null  -- Premium users don't need ad_free_until
  where id = target_user_id;
end;
$$;

-- Grant execute permissions
grant execute on function public.is_user_ad_free(uuid) to authenticated;
grant execute on function public.grant_ad_free_time(uuid, int) to authenticated;
grant execute on function public.downgrade_from_premium(uuid) to authenticated;
grant execute on function public.upgrade_to_premium(uuid) to authenticated;

-- Create ad watch log table for tracking rewarded ad views
create table if not exists public.ad_watch_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ad_type varchar(50) not null default 'rewarded',
  hours_granted int not null default 2,
  watched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Create index for ad watch log
create index if not exists ad_watch_log_user_id_idx
  on public.ad_watch_log (user_id, watched_at desc);

-- Enable RLS on ad_watch_log
alter table public.ad_watch_log enable row level security;

-- RLS policies for ad_watch_log
drop policy if exists "Users can read own ad watch log" on public.ad_watch_log;
create policy "Users can read own ad watch log"
on public.ad_watch_log
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own ad watch log" on public.ad_watch_log;
create policy "Users can insert own ad watch log"
on public.ad_watch_log
for insert
to authenticated
with check (user_id = auth.uid());

-- Function to log ad watch and grant ad-free time
create or replace function public.watch_ad_for_reward(target_user_id uuid, hours_to_grant int default 2)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if auth.uid() != target_user_id then
    raise exception 'can only log ad watch for self';
  end if;

  -- Calculate expiration time
  declare
    new_expires_at timestamptz := now() + (hours_to_grant || ' hours')::interval;
  begin
    -- Log the ad watch
    insert into public.ad_watch_log (user_id, ad_type, hours_granted, expires_at)
    values (target_user_id, 'rewarded', hours_to_grant, new_expires_at);

    -- Grant ad-free time
    update public.users
    set ad_free_until = greatest(
      coalesce(ad_free_until, now()),
      now()
    ) + (hours_to_grant || ' hours')::interval
    where id = target_user_id;
  end;
end;
$$;

grant execute on function public.watch_ad_for_reward(uuid, int) to authenticated;

-- Comment on columns
comment on column public.users.ad_free_until is 'Timestamp until which user has ad-free access. Null means no ad-free time.';
comment on column public.users.is_premium is 'Whether user has premium subscription (no ads at all).';
comment on column public.ad_watch_log.ad_type is 'Type of ad watched: rewarded, optional, etc.';
comment on column public.ad_watch_log.hours_granted is 'Number of ad-free hours granted for watching this ad.';
comment on column public.ad_watch_log.expires_at is 'When this specific ad-free period expires.';