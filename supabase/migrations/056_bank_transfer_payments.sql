do $$
begin
  create type public.bank_transfer_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.bank_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id text not null,
  amount_try int not null check (amount_try > 0),
  reference_code text not null unique,
  status public.bank_transfer_request_status not null default 'pending',
  receipt_storage_path text,
  admin_note text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bank_transfer_requests_status_created_idx
on public.bank_transfer_requests (status, created_at desc);

create index if not exists bank_transfer_requests_user_created_idx
on public.bank_transfer_requests (user_id, created_at desc);

create unique index if not exists bank_transfer_requests_one_pending_per_user_plan_idx
on public.bank_transfer_requests (user_id, plan_id)
where status = 'pending';

alter table public.bank_transfer_requests enable row level security;

create policy "Users read own bank transfer requests"
on public.bank_transfer_requests
for select
to authenticated
using (user_id = auth.uid());

create policy "Platform admins read all bank transfer requests"
on public.bank_transfer_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  )
);

create or replace function public.create_bank_transfer_request(
  p_plan_id text,
  p_amount_try int
)
returns public.bank_transfer_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.bank_transfer_requests%rowtype;
  normalized_plan_id text := trim(p_plan_id);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if normalized_plan_id = '' then
    raise exception 'plan id is required';
  end if;

  if p_amount_try is null or p_amount_try <= 0 then
    raise exception 'amount must be positive';
  end if;

  select *
  into saved
  from public.bank_transfer_requests btr
  where btr.user_id = auth.uid()
    and btr.plan_id = normalized_plan_id
    and btr.status = 'pending'
  limit 1;

  if found then
    return saved;
  end if;

  insert into public.bank_transfer_requests (
    user_id,
    plan_id,
    amount_try,
    reference_code
  )
  values (
    auth.uid(),
    normalized_plan_id,
    p_amount_try,
    'ZIGO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  returning * into saved;

  return saved;
end;
$$;

create or replace function public.attach_bank_transfer_receipt(
  p_request_id uuid,
  p_receipt_storage_path text
)
returns public.bank_transfer_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.bank_transfer_requests%rowtype;
  normalized_path text := trim(p_receipt_storage_path);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if normalized_path = '' then
    raise exception 'receipt path is required';
  end if;

  if normalized_path !~ ('^' || auth.uid()::text || '/[0-9a-f-]{36}\.[a-z0-9]+$') then
    raise exception 'invalid receipt path';
  end if;

  update public.bank_transfer_requests
  set receipt_storage_path = normalized_path
  where id = p_request_id
    and user_id = auth.uid()
    and status = 'pending'
  returning * into saved;

  if not found then
    raise exception 'pending bank transfer request was not found';
  end if;

  return saved;
end;
$$;

create or replace function public.review_bank_transfer_request(
  p_request_id uuid,
  p_status public.bank_transfer_request_status,
  p_admin_note text default null,
  p_period_end timestamptz default null
)
returns public.bank_transfer_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.bank_transfer_requests%rowtype;
  target public.bank_transfer_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  if p_status not in ('approved', 'rejected', 'cancelled') then
    raise exception 'invalid review status';
  end if;

  select *
  into target
  from public.bank_transfer_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'bank transfer request was not found';
  end if;

  if target.status <> 'pending' then
    raise exception 'request is no longer pending';
  end if;

  if p_status = 'approved' then
    if p_period_end is null then
      raise exception 'period end is required for approval';
    end if;

    perform public.set_user_subscription_tier(
      target.user_id,
      'zigo_plus'::public.subscription_tier,
      null,
      'bank:' || target.reference_code,
      p_period_end
    );
  end if;

  update public.bank_transfer_requests
  set
    status = p_status,
    admin_note = nullif(trim(p_admin_note), ''),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    period_end = case when p_status = 'approved' then p_period_end else null end
  where id = p_request_id
  returning * into saved;

  return saved;
end;
$$;

grant execute on function public.create_bank_transfer_request(text, int) to authenticated;
grant execute on function public.attach_bank_transfer_receipt(uuid, text) to authenticated;
grant execute on function public.review_bank_transfer_request(uuid, public.bank_transfer_request_status, text, timestamptz) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'billing-receipts',
  'billing-receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload own billing receipts"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'billing-receipts'
  and owner = auth.uid()
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users read own billing receipts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'billing-receipts'
  and owner = auth.uid()
);

create policy "Platform admins read billing receipts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'billing-receipts'
  and exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  )
);

create policy "Users update own billing receipts"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'billing-receipts'
  and owner = auth.uid()
)
with check (
  bucket_id = 'billing-receipts'
  and owner = auth.uid()
);

create policy "Users delete own billing receipts"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'billing-receipts'
  and owner = auth.uid()
);
