-- Migration 120: Scheduled Notifications & Broadcast History
-- Admin tarafından oluşturulan zamanlanmış ve geçmiş toplu bildirimler

create table if not exists notification_schedules (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references users(id) on delete cascade,
  title       text not null,
  body        text not null,
  target_role text not null default 'all',  -- all | student | teacher | parent | education_institution | education_platform | publisher
  target_filter jsonb default '{}'::jsonb,  -- { subscribed_only: bool, trial_only: bool, expired_only: bool }
  template_key text,                         -- Hangi şablondan üretildi
  status      text not null default 'pending' check (status in ('pending','sent','failed','cancelled')),
  scheduled_at timestamptz,                  -- null = hemen gönder
  sent_at     timestamptz,
  sent_count  int default 0,
  error_msg   text,
  created_at  timestamptz not null default now()
);

-- Index: admin tarafından sorgulama
create index if not exists idx_notification_schedules_created_by
  on notification_schedules(created_by, created_at desc);

create index if not exists idx_notification_schedules_status
  on notification_schedules(status, scheduled_at);

-- RLS: Sadece admin görebilir/yazabilir
alter table notification_schedules enable row level security;

create policy "platform_admin_full_access_notification_schedules"
  on notification_schedules
  for all
  to authenticated
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.is_platform_admin = true
    )
  );

-- Broadcast şablonları tablosu
create table if not exists notification_templates (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  label       text not null,
  title       text not null,
  body        text not null,
  emoji       text default '📣',
  sort_order  int default 0,
  created_at  timestamptz not null default now()
);

alter table notification_templates enable row level security;

create policy "platform_admin_full_access_notification_templates"
  on notification_templates
  for all
  to authenticated
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.is_platform_admin = true
    )
  );

-- Varsayılan şablonlar
insert into notification_templates (key, label, title, body, emoji, sort_order) values
  ('welcome_back',   'Geri Dön!',              'Seni Özledik! 👋',                   'Bir süredir görünmüyorsun. Yeni dersler ve oyunlar seni bekliyor!',                              '👋', 1),
  ('new_feature',    'Yeni Özellik',            '✨ Yeni Güncelleme Yayında!',         'Zigo''ya yeni özellikler eklendi. Keşfetmek için hemen giriş yap.',                            '✨', 2),
  ('exam_reminder',  'Sınav Hatırlatma',        '📝 Sınav Zamanı Yaklaşıyor!',        'Hedeflerine ulaşmak için çalışmaya devam et. Şimdi tekrar yapmak için harika bir zaman!',      '📝', 3),
  ('trial_expiring', 'Deneme Bitiyor',          '⏰ Zigo Plus Denemen Bitiyor!',       'Ücretsiz deneme süren doluyor. Özel indirimli fiyatla hemen abone ol!',                        '⏰', 4),
  ('maintenance',    'Bakım Duyurusu',          '🔧 Planlı Bakım Bildirimi',           'Sistem kısa süreliğine bakım moduna alınacak. Verilerini kaybetmeyeceksin.',                    '🔧', 5),
  ('new_content',    'Yeni İçerik',             '🎓 Yeni Dersler Yayında!',           'Öğretmenler yeni içerikler paylaştı. Keşfetmek için hemen Zigo''ya gir!',                     '🎓', 6)
on conflict (key) do nothing;
