-- Performance Indexes for ZIGO
-- Generated from query pattern analysis
-- Run in Supabase SQL Editor

-- ============================================
-- GAME_PROGRESS (High traffic: games, leaderboard)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gp_user_type_created
ON game_progress (user_id, game_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gp_user_type_score
ON game_progress (user_id, game_type, score DESC)
WHERE is_completed = true;

-- Leaderboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gp_type_score_created
ON game_progress (game_type, score DESC, created_at DESC)
WHERE is_completed = true;

-- ============================================
-- QUIZ_ATTEMPTS (High traffic: learn, quiz)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qa_child_quiz_created
ON quiz_attempts (child_profile_id, quiz_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qa_quiz_score_created
ON quiz_attempts (quiz_id, score DESC, created_at DESC);

-- ============================================
-- SOCIAL_POSTS (Feed, explore, profile)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sp_created_visibility
ON social_posts (created_at DESC)
WHERE visibility = 'public';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sp_author_created
ON social_posts (author_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sp_area_created
ON social_posts (area_id, created_at DESC)
WHERE visibility = 'public';

-- ============================================
-- SOCIAL_COMMENTS (Post detail, notifications)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sc_post_created
ON social_comments (post_id, created_at ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sc_author_created
ON social_comments (author_id, created_at DESC);

-- ============================================
-- SOCIAL_LIKES (Like checks, counts)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sl_post_user
ON social_likes (post_id, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sl_user_created
ON social_likes (user_id, created_at DESC);

-- ============================================
-- SOCIAL_SAVES (Save checks, user saves page)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ss_user_created
ON social_saves (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ss_post_user
ON social_saves (post_id, user_id);

-- ============================================
-- SOCIAL_FOLLOWS (Follow checks, followers/following)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sf_follower_following
ON social_follows (follower_id, following_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sf_following_created
ON social_follows (following_id, created_at DESC);

-- ============================================
-- SOCIAL_STORIES (Stories feed)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_st_author_created
ON social_stories (author_id, created_at DESC)
WHERE expires_at > now();

-- ============================================
-- TABOO_DUELS (Game matching, invite)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_td_code
ON taboo_duels (code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_td_status_created
ON taboo_duels (status, created_at DESC)
WHERE status IN ('waiting', 'active');

-- ============================================
-- TABOO_CUSTOM_CARDS (Deck management)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tcc_deck_created
ON taboo_custom_cards (deck_id, created_at DESC);

-- ============================================
-- TABOO_CUSTOM_DECKS (Teacher decks)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tcd_teacher_created
ON taboo_custom_decks (teacher_id, created_at DESC);

-- ============================================
-- GAME_PROGRESS PARTITION PREP (Future scaling)
-- ============================================
-- Uncomment when table > 100M rows:
-- ALTER TABLE game_progress SET (autovacuum_vacuum_scale_factor = 0.01);
-- ALTER TABLE game_progress SET (autovacuum_analyze_scale_factor = 0.01);

-- ============================================
-- USERS (Auth, profile, search)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
ON users (email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_verified
ON users (role, is_verified)
WHERE is_verified = true;

-- ============================================
-- CHILD_PROFILES (Parent dashboard, quiz)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cp_parent_created
ON child_profiles (parent_id, created_at DESC);

-- ============================================
-- LEARNING_ROOMS (Live learning)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lr_host_status
ON learning_rooms (host_id, status)
WHERE status IN ('active', 'waiting');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lr_code
ON learning_rooms (code);

-- ============================================
-- NOTIFICATIONS (Real-time, bell icon)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notif_user_unread_created
ON notifications (user_id, is_read, created_at DESC)
WHERE is_read = false;

-- ============================================
-- ANALYTICS HELPER: pg_stat_statements monitoring
-- ============================================
-- Run manually to find slow queries:
-- SELECT query, calls, mean_exec_time, total_exec_time
-- FROM pg_stat_statements
-- WHERE mean_exec_time > 100
-- ORDER BY mean_exec_time DESC LIMIT 20;

-- ============================================
-- VACUUM TUNING (Run after index creation)
-- ============================================
-- ANALYZE game_progress;
-- ANALYZE quiz_attempts;
-- ANALYZE social_posts;
-- ANALYZE social_comments;
-- ANALYZE social_likes;
-- ANALYZE taboo_duels;
-- ANALYZE taboo_custom_cards;