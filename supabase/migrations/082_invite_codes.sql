-- Invite codes for teacher/parent growth loops.

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_id uuid not null references public.users(id) on delete cascade,
  role_hint text check (role_hint is null or role_hint in ('teacher', 'parent', 'student')),
  max_uses int not null default 25 check (max_uses > 0 and max_uses <= 500),
  use_count int not null default 0 check (use_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint invite_codes_use_bounds check (use_count <= max_uses)
);

create table if not exists public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  invite_code_id uuid not null references public.invite_codes(id) on delete cascade,
  redeemer_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (invite_code_id, redeemer_id)
);

create index if not exists invite_codes_owner_id_idx on public.invite_codes (owner_id, created_at desc);
create index if not exists invite_codes_code_idx on public.invite_codes (lower(code));

alter table public.invite_codes enable row level security;
alter table public.invite_redemptions enable row level security;

drop policy if exists "Owners read own invite codes" on public.invite_codes;
create policy "Owners read own invite codes"
on public.invite_codes
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Owners create invite codes" on public.invite_codes;
create policy "Owners create invite codes"
on public.invite_codes
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners update own invite codes" on public.invite_codes;
create policy "Owners update own invite codes"
on public.invite_codes
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users read own invite redemptions" on public.invite_redemptions;
create policy "Users read own invite redemptions"
on public.invite_redemptions
for select
to authenticated
using (redeemer_id = auth.uid());

create or replace function public.redeem_invite_code(
  raw_code text,
  redeemer uuid default auth.uid()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.invite_codes%rowtype;
  normalized text := upper(trim(coalesce(raw_code, '')));
begin
  if redeemer is null then
    raise exception 'Not authenticated';
  end if;

  if length(normalized) < 4 then
    raise exception 'Invalid invite code';
  end if;

  select * into invite_row
  from public.invite_codes
  where upper(code) = normalized
    and is_active = true
  for update;

  if not found then
    raise exception 'Invite code not found';
  end if;

  if invite_row.owner_id = redeemer then
    raise exception 'Cannot redeem own invite';
  end if;

  if invite_row.use_count >= invite_row.max_uses then
    raise exception 'Invite code exhausted';
  end if;

  insert into public.invite_redemptions (invite_code_id, redeemer_id)
  values (invite_row.id, redeemer)
  on conflict do nothing;

  if found then
    update public.invite_codes
    set use_count = use_count + 1
    where id = invite_row.id;
  end if;

  return invite_row.id;
end;
$$;

grant execute on function public.redeem_invite_code(text, uuid) to authenticated;

grant select, insert, update on public.invite_codes to authenticated;
grant select on public.invite_redemptions to authenticated;
