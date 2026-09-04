-- increment_game_seconds RPC function
-- Mevcut günlük oyun süresine atomic olarak ekler
CREATE OR REPLACE FUNCTION increment_game_seconds(
  p_user_id uuid,
  p_date    date,
  p_seconds integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO game_daily_usage (user_id, date, seconds_played)
    VALUES (p_user_id, p_date, p_seconds)
  ON CONFLICT (user_id, date)
    DO UPDATE SET seconds_played = game_daily_usage.seconds_played + EXCLUDED.seconds_played;
END;
$$;
