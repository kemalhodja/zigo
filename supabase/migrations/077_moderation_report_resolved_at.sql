-- Moderation SLA: track when reports leave the open queue.

alter table public.content_reports
  add column if not exists resolved_at timestamptz;

create index if not exists content_reports_resolved_at_idx
on public.content_reports (resolved_at desc)
where resolved_at is not null;

comment on column public.content_reports.resolved_at is
  'Set when status becomes resolved or dismissed; cleared if reopened.';
