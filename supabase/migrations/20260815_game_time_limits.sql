-- Migration: Game time limits and parent game settings
-- Run this in your Supabase SQL editor

-- 1. Günlük oyun süresi takibi
CREATE TABLE IF NOT EXISTS game_daily_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  seconds_played integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

-- Row Level Security
ALTER TABLE game_daily_usage ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi kaydını okuyabilir
CREATE POLICY "Users can read own game usage"
  ON game_daily_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role her şeyi yapabilir (API'den yazma için)
CREATE POLICY "Service role manages game usage"
  ON game_daily_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Veli oyun ayarları (child_profiles bazında)
CREATE TABLE IF NOT EXISTS parent_game_settings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_profile_id  uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  daily_limit_minutes integer NOT NULL DEFAULT 60,
  night_ban_enabled   boolean NOT NULL DEFAULT true,
  night_ban_start     time NOT NULL DEFAULT '22:00',
  night_ban_end       time NOT NULL DEFAULT '08:00',
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (parent_user_id, child_profile_id)
);

ALTER TABLE parent_game_settings ENABLE ROW LEVEL SECURITY;

-- Veli kendi kayıtlarını yönetebilir
CREATE POLICY "Parents manage own game settings"
  ON parent_game_settings FOR ALL
  USING (auth.uid() = parent_user_id)
  WITH CHECK (auth.uid() = parent_user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_game_daily_usage_user_date ON game_daily_usage (user_id, date);
CREATE INDEX IF NOT EXISTS idx_parent_game_settings_child ON parent_game_settings (child_profile_id);
