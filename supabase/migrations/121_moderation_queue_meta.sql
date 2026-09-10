-- Migration 121: Moderation Queue Metadata
-- İçerik moderasyon kuyruğu için ek meta: moderatör notları, eskalasyon, toplu işlem geçmişi

-- Moderatör karar logu (mevcut content_reports tablosuna ek)
create table if not exists moderation_decisions (
  id              uuid primary key default gen_random_uuid(),
  moderator_id    uuid not null references users(id) on delete cascade,
  content_type    text not null check (content_type in ('post','story','reel','comment','profile')),
  content_id      uuid not null,
  decision        text not null check (decision in ('approved','hidden','deleted','escalated','dismissed')),
  note            text,
  is_escalated    boolean not null default false,
  escalation_note text,
  ai_flagged      boolean not null default false,
  ai_flag_reason  text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_moderation_decisions_content
  on moderation_decisions(content_type, content_id);

create index if not exists idx_moderation_decisions_moderator
  on moderation_decisions(moderator_id, created_at desc);

create index if not exists idx_moderation_decisions_escalated
  on moderation_decisions(is_escalated, created_at desc) where is_escalated = true;

-- Toplu moderasyon işlem geçmişi
create table if not exists moderation_bulk_actions (
  id              uuid primary key default gen_random_uuid(),
  moderator_id    uuid not null references users(id) on delete cascade,
  action          text not null check (action in ('bulk_approve','bulk_hide','bulk_delete','bulk_escalate')),
  content_type    text not null,
  content_ids     uuid[] not null,
  affected_count  int not null default 0,
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_moderation_bulk_actions_moderator
  on moderation_bulk_actions(moderator_id, created_at desc);

-- RLS: Sadece platform admin
alter table moderation_decisions enable row level security;
alter table moderation_bulk_actions enable row level security;

create policy "platform_admin_moderation_decisions"
  on moderation_decisions
  for all
  to authenticated
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.is_platform_admin = true
    )
  );

create policy "platform_admin_bulk_actions"
  on moderation_bulk_actions
  for all
  to authenticated
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.is_platform_admin = true
    )
  );

-- social_posts tablosuna AI flag kolonları (yoksa ekle)
alter table social_posts
  add column if not exists ai_flagged boolean not null default false,
  add column if not exists ai_flag_reason text,
  add column if not exists moderation_priority text not null default 'normal'
    check (moderation_priority in ('low','normal','high','critical'));

create index if not exists idx_social_posts_ai_flagged
  on social_posts(ai_flagged, created_at desc) where ai_flagged = true;

create index if not exists idx_social_posts_moderation_priority
  on social_posts(moderation_priority, created_at desc) where moderation_priority in ('high','critical');
