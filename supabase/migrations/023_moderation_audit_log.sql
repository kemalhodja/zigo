create table if not exists public.moderation_audit_log (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.users(id) on delete cascade,
  item_id uuid not null,
  item_kind text not null check (item_kind in ('comment', 'story_reply')),
  next_status text not null check (next_status in ('approved', 'rejected')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.moderation_audit_log enable row level security;

create policy "Platform admins can read moderation audit log"
on public.moderation_audit_log
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Moderators can create moderation audit log"
on public.moderation_audit_log
for insert
to authenticated
with check (
  moderator_id = auth.uid()
  and (
    public.current_user_is_platform_admin()
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'teacher'
        and users.is_verified = true
    )
  )
);
