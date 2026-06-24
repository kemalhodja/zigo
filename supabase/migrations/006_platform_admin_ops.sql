create table public.platform_admins (
  user_id uuid primary key references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.current_user_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = auth.uid()
  )
$$;

create policy "Platform admins can read admin list"
on public.platform_admins
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Platform admins can read all users"
on public.users
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Platform admins can read all store products"
on public.store_products
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Platform admins can read all store redemptions"
on public.store_redemptions
for select
to authenticated
using (public.current_user_is_platform_admin());

create or replace function public.verify_teacher(
  target_teacher_id uuid,
  verified boolean
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_teacher public.users;
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'platform admin access is required';
  end if;

  update public.users
  set is_verified = verified
  where id = target_teacher_id
    and role = 'teacher'
  returning * into updated_teacher;

  if not found then
    raise exception 'teacher profile was not found';
  end if;

  return updated_teacher;
end;
$$;

grant execute on function public.verify_teacher(uuid, boolean) to authenticated;

create or replace function public.update_store_redemption_status(
  target_redemption_id uuid,
  next_status public.store_redemption_status
)
returns public.store_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_redemption public.store_redemptions;
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'platform admin access is required';
  end if;

  update public.store_redemptions
  set status = next_status
  where id = target_redemption_id
  returning * into updated_redemption;

  if not found then
    raise exception 'store redemption was not found';
  end if;

  return updated_redemption;
end;
$$;

grant execute on function public.update_store_redemption_status(uuid, public.store_redemption_status) to authenticated;

create or replace function public.update_store_product_stock(
  target_product_id uuid,
  next_stock_count int
)
returns public.store_products
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_product public.store_products;
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'platform admin access is required';
  end if;

  if next_stock_count < 0 then
    raise exception 'stock count cannot be negative';
  end if;

  update public.store_products
  set stock_count = next_stock_count
  where id = target_product_id
  returning * into updated_product;

  if not found then
    raise exception 'store product was not found';
  end if;

  return updated_product;
end;
$$;

grant execute on function public.update_store_product_stock(uuid, int) to authenticated;
