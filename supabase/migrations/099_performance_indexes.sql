-- 099_performance_indexes.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Social Posts B-Tree Indexes for fast filtering and ordering
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_author_id ON public.social_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_media_type ON public.social_posts (media_type);

-- GIN Index for fast ILIKE searches on Explore Page (caption)
CREATE INDEX IF NOT EXISTS idx_social_posts_caption_trgm ON public.social_posts USING gin (caption gin_trgm_ops);

-- User Profile Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm ON public.users USING gin (full_name gin_trgm_ops);
