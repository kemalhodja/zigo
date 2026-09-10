-- Migration: 119_user_admin_notes.sql
-- Platform adminlerinin kullanicilar hakkinda dahili not ve etiket tutabilmesi icin durable tablo.

create table if not exists public.user_admin_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  admin_id uuid not null references public.users(id) on delete cascade,
  note text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_user_admin_notes_user_id
  on public.user_admin_notes (user_id, created_at desc);

create index if not exists idx_user_admin_notes_admin_id
  on public.user_admin_notes (admin_id);

alter table public.user_admin_notes enable row level security;

-- Platform adminleri notlari okuyabilir
drop policy if exists "Platform admins can read user admin notes" on public.user_admin_notes;
create policy "Platform admins can read user admin notes"
  on public.user_admin_notes
  for select
  to authenticated
  using (public.current_user_is_platform_admin());

-- Platform adminleri not ekleyebilir
drop policy if exists "Platform admins can insert user admin notes" on public.user_admin_notes;
create policy "Platform admins can insert user admin notes"
  on public.user_admin_notes
  for insert
  to authenticated
  with check (
    public.current_user_is_platform_admin()
    and admin_id = auth.uid()
  );

-- Platform adminleri not silebilir
drop policy if exists "Platform admins can delete user admin notes" on public.user_admin_notes;
create policy "Platform admins can delete user admin notes"
  on public.user_admin_notes
  for delete
  to authenticated
  using (public.current_user_is_platform_admin());

grant select, insert, delete on public.user_admin_notes to authenticated;
grant all on public.user_admin_notes to service_role;

notify pgrst, 'reload schema';
