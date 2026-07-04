create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  reason text not null default 'safety_review' check (
    reason in ('safety_review', 'misinformation', 'bullying', 'inappropriate', 'other')
  ),
  status text not null default 'open' check (
    status in ('open', 'reviewing', 'resolved', 'dismissed')
  ),
  created_at timestamptz not null default now(),
  constraint content_reports_unique_report unique (post_id, reporter_id)
);

create index content_reports_status_created_at_idx
on public.content_reports (status, created_at desc);

create index content_reports_post_created_at_idx
on public.content_reports (post_id, created_at desc);

alter table public.content_reports enable row level security;

create policy "Users can read own reports"
on public.content_reports
for select
to authenticated
using (reporter_id = auth.uid());

create policy "Users can report posts"
on public.content_reports
for insert
to authenticated
with check (reporter_id = auth.uid());
