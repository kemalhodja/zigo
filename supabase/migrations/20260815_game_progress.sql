-- Game Progress: Her kullanıcı için oyun bazında yüksek skor ve son seviye kaydı
CREATE TABLE IF NOT EXISTS game_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type     text NOT NULL CHECK (game_type IN ('memory_card', 'block_puzzle', 'pipe_connect')),
  high_score    int NOT NULL DEFAULT 0,
  last_level    int NOT NULL DEFAULT 0,  -- Pipe Connect için son tamamlanan seviye
  total_plays   int NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_type)
);

ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi ilerleme verisini okuyabilir
CREATE POLICY "game_progress_select_own"
  ON game_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcı kendi ilerleme verisini yazabilir
CREATE POLICY "game_progress_upsert_own"
  ON game_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "game_progress_update_own"
  ON game_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS game_progress_user_game_idx ON game_progress(user_id, game_type);
