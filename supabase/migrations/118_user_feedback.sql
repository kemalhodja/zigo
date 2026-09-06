-- P1: Persist user feedback in a dedicated, admin-only queue.
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in ('request', 'complaint')),
  subject varchar(120) not null check (char_length(subject) between 3 and 120),
  content text not null check (char_length(content) between 10 and 1500),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists user_feedback_status_created_at_idx
  on public.user_feedback (status, created_at desc);
create index if not exists user_feedback_user_created_at_idx
  on public.user_feedback (user_id, created_at desc);

alter table public.user_feedback enable row level security;

drop policy if exists "Users can submit own feedback" on public.user_feedback;
create policy "Users can submit own feedback"
on public.user_feedback
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can read own feedback" on public.user_feedback;
create policy "Users can read own feedback"
on public.user_feedback
for select
to authenticated
using (user_id = auth.uid() or public.current_user_is_platform_admin());

drop policy if exists "Platform admins can update feedback" on public.user_feedback;
create policy "Platform admins can update feedback"
on public.user_feedback
for update
to authenticated
using (public.current_user_is_platform_admin())
with check (public.current_user_is_platform_admin());

grant select, insert, update on public.user_feedback to authenticated, service_role;
