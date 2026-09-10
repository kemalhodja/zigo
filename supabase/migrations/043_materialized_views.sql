-- Materialized Views & Cron Jobs for Leaderboards/Analytics
-- Run AFTER 042_performance_indexes.sql

-- ============================================
-- WEEKLY LEADERBOARD (All game types)
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_weekly_leaderboard AS
SELECT
  user_id,
  game_type,
  SUM(score) as total_score,
  COUNT(*) as games_played,
  MAX(level) as max_level,
  AVG(score)::numeric(10,2) as avg_score
FROM game_progress
WHERE created_at > now() - interval '7 days'
  AND is_completed = true
GROUP BY user_id, game_type;

CREATE UNIQUE INDEX IF NOT EXISTS mv_weekly_leaderboard_pkey
ON mv_weekly_leaderboard (user_id, game_type);

CREATE INDEX IF NOT EXISTS mv_weekly_leaderboard_score
ON mv_weekly_leaderboard (game_type, total_score DESC);

-- ============================================
-- MONTHLY LEADERBOARD
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_leaderboard AS
SELECT
  user_id,
  game_type,
  SUM(score) as total_score,
  COUNT(*) as games_played,
  MAX(level) as max_level
FROM game_progress
WHERE created_at > now() - interval '30 days'
  AND is_completed = true
GROUP BY user_id, game_type;

CREATE UNIQUE INDEX IF NOT EXISTS mv_monthly_leaderboard_pkey
ON mv_monthly_leaderboard (user_id, game_type);

CREATE INDEX IF NOT EXISTS mv_monthly_leaderboard_score
ON mv_monthly_leaderboard (game_type, total_score DESC);

-- ============================================
-- TOP PLAYERS (Global, all-time)
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_players AS
SELECT
  user_id,
  SUM(score) as lifetime_score,
  COUNT(*) as total_games,
  COUNT(DISTINCT game_type) as games_mastered,
  MAX(created_at) as last_played
FROM game_progress
WHERE is_completed = true
GROUP BY user_id
ORDER BY lifetime_score DESC
LIMIT 1000;

CREATE UNIQUE INDEX IF NOT EXISTS mv_top_players_pkey
ON mv_top_players (user_id);

-- ============================================
-- QUIZ PERFORMANCE SUMMARY
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_quiz_performance AS
SELECT
  q.id as quiz_id,
  q.title,
  q.area_id,
  COUNT(qa.id) as total_attempts,
  AVG(qa.score)::numeric(5,2) as avg_score,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY qa.score) as median_score,
  COUNT(DISTINCT qa.child_profile_id) as unique_players
FROM quizzes q
LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
GROUP BY q.id, q.title, q.area_id;

CREATE INDEX IF NOT EXISTS mv_quiz_perf_area
ON mv_quiz_performance (area_id);

-- ============================================
-- PG_CRON JOBS (Enable pg_cron extension first)
-- ============================================
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Refresh weekly leaderboard every 5 minutes
-- SELECT cron.schedule('refresh-weekly-lb', '*/5 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_leaderboard;'
-- );

-- Refresh monthly leaderboard every 15 minutes
-- SELECT cron.schedule('refresh-monthly-lb', '*/15 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_leaderboard;'
-- );

-- Refresh top players hourly
-- SELECT cron.schedule('refresh-top-players', '0 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_players;'
-- );

-- Refresh quiz performance every 30 minutes
-- SELECT cron.schedule('refresh-quiz-perf', '*/30 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_quiz_performance;'
-- );

-- Clean up old cron jobs (run once)
-- SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname LIKE 'refresh-%';

-- ============================================
-- VERIFY VIEWS
-- ============================================
-- SELECT * FROM mv_weekly_leaderboard WHERE game_type = 'word_hunt' ORDER BY total_score DESC LIMIT 10;
-- SELECT * FROM mv_monthly_leaderboard WHERE game_type = 'memory_card' ORDER BY total_score DESC LIMIT 10;
-- SELECT * FROM mv_top_players LIMIT 20;