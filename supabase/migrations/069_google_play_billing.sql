-- Migration 069: Google Play Billing Integration

-- Create table public.google_play_purchases if not exists
create table if not exists public.google_play_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id varchar(100) not null,
  product_id varchar(100) not null,
  purchase_token text not null,
  order_id varchar(255),
  package_name varchar(255) not null,
  expiry_time timestamptz,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for lookup
create index if not exists google_play_purchases_user_id_idx on public.google_play_purchases(user_id);
create unique index if not exists google_play_purchases_token_idx on public.google_play_purchases(purchase_token);

-- Enable RLS
alter table public.google_play_purchases enable row level security;

-- RLS Policies
drop policy if exists "Users can read own google play purchases" on public.google_play_purchases;
create policy "Users can read own google play purchases"
on public.google_play_purchases
for select
to authenticated
using (user_id = auth.uid());

-- RPC to record Google Play purchases and update user subscription tier
create or replace function public.record_google_play_purchase(
  p_user_id uuid,
  p_plan_id text,
  p_product_id text,
  p_purchase_token text,
  p_order_id text default null,
  p_package_name text default 'com.zigo.app',
  p_expiry_time timestamptz default null
)
returns public.google_play_purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_row public.google_play_purchases;
  computed_expiry timestamptz;
begin
  -- Calculate expiry time if not provided based on planId (default to 30 days for monthly, 180 for semiannual, 365 for yearly)
  if p_expiry_time is null then
    if p_plan_id like '%yearly%' then
      computed_expiry := now() + interval '365 days';
    elsif p_plan_id like '%semiannual%' then
      computed_expiry := now() + interval '180 days';
    else
      computed_expiry := now() + interval '30 days';
    end if;
  else
    computed_expiry := p_expiry_time;
  end if;

  -- Insert/record the purchase details
  insert into public.google_play_purchases (
    user_id,
    plan_id,
    product_id,
    purchase_token,
    order_id,
    package_name,
    expiry_time,
    verified_at
  )
  values (
    p_user_id,
    p_plan_id,
    p_product_id,
    p_purchase_token,
    p_order_id,
    p_package_name,
    computed_expiry,
    now()
  )
  on conflict (purchase_token) do update
  set
    expiry_time = excluded.expiry_time,
    verified_at = now()
  returning * into inserted_row;

  -- Update the user's subscription tier to zigo_plus
  perform public.set_user_subscription_tier(
    p_user_id,
    'zigo_plus'::public.subscription_tier,
    null, -- no stripe customer id
    null, -- no stripe subscription id
    computed_expiry
  );

  return inserted_row;
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.record_google_play_purchase(uuid, text, text, text, text, text, timestamptz) to authenticated;
