create type public.store_product_category as enum (
  'stationery',
  'book',
  'question_bank',
  'digital_avatar',
  'experience'
);

create type public.store_redemption_status as enum (
  'pending_parent_approval',
  'approved',
  'fulfilled',
  'cancelled'
);

create table public.store_products (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  description text not null,
  category public.store_product_category not null,
  price_points int not null check (price_points > 0),
  image_url varchar(255),
  stock_count int check (stock_count is null or stock_count >= 0),
  requires_parent_approval boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.store_redemptions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products(id),
  user_id uuid references public.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete cascade,
  points_spent int not null check (points_spent > 0),
  status public.store_redemption_status not null default 'pending_parent_approval',
  note text,
  created_at timestamptz not null default now(),
  constraint store_redemptions_owner_check check (
    (user_id is not null and child_profile_id is null)
    or (user_id is null and child_profile_id is not null)
  )
);

create index store_products_active_idx on public.store_products (is_active, category);
create index store_redemptions_user_id_idx on public.store_redemptions (user_id, created_at desc);
create index store_redemptions_child_profile_id_idx on public.store_redemptions (child_profile_id, created_at desc);

alter table public.store_products enable row level security;
alter table public.store_redemptions enable row level security;

create policy "Active store products are readable"
on public.store_products
for select
to authenticated
using (is_active = true);

create policy "Students can read own redemptions"
on public.store_redemptions
for select
to authenticated
using (user_id = auth.uid());

create policy "Parents can read child redemptions"
on public.store_redemptions
for select
to authenticated
using (
  exists (
    select 1
    from public.child_profiles
    where child_profiles.id = store_redemptions.child_profile_id
      and child_profiles.parent_id = auth.uid()
  )
);

create or replace function public.redeem_store_product(
  target_product_id uuid,
  redemption_note text default null
)
returns public.store_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  product public.store_products;
  current_points int;
  inserted_redemption public.store_redemptions;
begin
  if public.current_user_role() <> 'student' then
    raise exception 'only student accounts can redeem store products directly';
  end if;

  select * into product
  from public.store_products
  where id = target_product_id
    and is_active = true
  for update;

  if not found then
    raise exception 'store product was not found';
  end if;

  if product.stock_count is not null and product.stock_count <= 0 then
    raise exception 'store product is out of stock';
  end if;

  select total_points into current_points
  from public.users
  where id = auth.uid()
    and role = 'student'
  for update;

  if current_points is null then
    raise exception 'student profile was not found';
  end if;

  if current_points < product.price_points then
    raise exception 'not enough Zigo Crystals';
  end if;

  update public.users
  set total_points = total_points - product.price_points
  where id = auth.uid();

  if product.stock_count is not null then
    update public.store_products
    set stock_count = stock_count - 1
    where id = target_product_id;
  end if;

  insert into public.store_redemptions (
    product_id,
    user_id,
    points_spent,
    status,
    note
  )
  values (
    target_product_id,
    auth.uid(),
    product.price_points,
    case
      when product.requires_parent_approval then 'pending_parent_approval'::public.store_redemption_status
      else 'approved'::public.store_redemption_status
    end,
    nullif(trim(redemption_note), '')
  )
  returning * into inserted_redemption;

  return inserted_redemption;
end;
$$;

grant execute on function public.redeem_store_product(uuid, text) to authenticated;

create or replace function public.redeem_child_store_product(
  target_child_profile_id uuid,
  target_product_id uuid,
  redemption_note text default null
)
returns public.store_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  product public.store_products;
  current_points int;
  inserted_redemption public.store_redemptions;
begin
  if public.current_user_role() <> 'parent' then
    raise exception 'only parents can redeem products for child profiles';
  end if;

  if not exists (
    select 1
    from public.child_profiles
    where id = target_child_profile_id
      and parent_id = auth.uid()
  ) then
    raise exception 'child profile does not belong to this parent';
  end if;

  select * into product
  from public.store_products
  where id = target_product_id
    and is_active = true
  for update;

  if not found then
    raise exception 'store product was not found';
  end if;

  if product.stock_count is not null and product.stock_count <= 0 then
    raise exception 'store product is out of stock';
  end if;

  select total_points into current_points
  from public.child_profiles
  where id = target_child_profile_id
  for update;

  if current_points < product.price_points then
    raise exception 'not enough Zigo Crystals';
  end if;

  update public.child_profiles
  set total_points = total_points - product.price_points
  where id = target_child_profile_id;

  if product.stock_count is not null then
    update public.store_products
    set stock_count = stock_count - 1
    where id = target_product_id;
  end if;

  insert into public.store_redemptions (
    product_id,
    child_profile_id,
    points_spent,
    status,
    note
  )
  values (
    target_product_id,
    target_child_profile_id,
    product.price_points,
    'approved'::public.store_redemption_status,
    nullif(trim(redemption_note), '')
  )
  returning * into inserted_redemption;

  return inserted_redemption;
end;
$$;

grant execute on function public.redeem_child_store_product(uuid, uuid, text) to authenticated;
