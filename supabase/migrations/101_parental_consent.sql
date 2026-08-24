-- Migration: 101_parental_consent.sql
-- KVKK / GDPR-K velisel onam altyapisi (18 yas alti ogrenciler icin)

create table if not exists public.parental_consents (
    id uuid default gen_random_uuid() primary key,
    student_user_id uuid not null references public.users(id) on delete cascade,
    parent_email text not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    token_hash text not null unique,
    requested_at timestamptz not null default now(),
    decided_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_parental_consents_student
    on public.parental_consents (student_user_id, created_at desc);

alter table public.parental_consents enable row level security;

drop policy if exists "Students can view own consent records" on public.parental_consents;
create policy "Students can view own consent records"
on public.parental_consents
for select
to authenticated
using (student_user_id = auth.uid());

grant select on public.parental_consents to authenticated;
grant all on public.parental_consents to service_role;

notify pgrst, 'reload schema';
