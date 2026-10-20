-- Migration 127: Feed, Games & Query Speedup Indexes for 60 FPS Fluidity
-- Adds composite indexes to eliminate table scans on high-traffic queries.

-- 1. Posts feed and author history lookup
CREATE INDEX IF NOT EXISTS idx_posts_feed_speedup
  ON public.posts (created_at DESC, target_audience)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_author_feed
  ON public.posts (author_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- 2. Game daily limits & night ban usage verification
CREATE INDEX IF NOT EXISTS idx_game_daily_usage_user_date
  ON public.game_daily_usage (user_id, date);

-- 3. Teacher private lesson requests & hook model lookup
CREATE INDEX IF NOT EXISTS idx_lesson_requests_receiver_status
  ON public.lesson_requests (receiver_id, status, created_at DESC);

-- 4. User quizzes and student study progress
CREATE INDEX IF NOT EXISTS idx_user_quizzes_user_created
  ON public.user_quizzes (user_id, created_at DESC);

-- 5. Focus sessions analytics lookup
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status
  ON public.focus_sessions (user_id, status, started_at DESC);
