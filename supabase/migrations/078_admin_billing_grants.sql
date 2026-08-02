-- Durable ledger for WhatsApp / offline sales fulfillments (Plus + sponsor grants).

create table if not exists public.admin_billing_grants (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('plus', 'sponsor')),
  duration_days integer not null check (duration_days > 0),
  note text,
  period_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_billing_grants_created_at_idx
  on public.admin_billing_grants (created_at desc);

create index if not exists admin_billing_grants_user_id_idx
  on public.admin_billing_grants (user_id);

alter table public.admin_billing_grants enable row level security;

create policy "Platform admins can read billing grants"
on public.admin_billing_grants
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Platform admins can insert billing grants"
on public.admin_billing_grants
for insert
to authenticated
with check (
  admin_id = auth.uid()
  and public.current_user_is_platform_admin()
);

grant select, insert on public.admin_billing_grants to authenticated;
grant all on public.admin_billing_grants to service_role;
