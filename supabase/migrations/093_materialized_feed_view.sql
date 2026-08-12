-- Optimize list_explore_social_posts using a Materialized View for faster feed loading
-- Run this migration to dramatically improve the speed of the /explore route

-- 1. Create the Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_explore_social_posts AS
SELECT
  sp.id as post_id,
  sp.created_at,
  sp.author_id,
  sp.area_id,
  sp.caption,
  sp.media_url,
  sp.media_type,
  sp.is_reel,
  sp.title,
  sp.content,
  sp.post_type,
  sp.co_author_id,
  u.id as u_id,
  u.full_name as u_full_name,
  u.role as u_role,
  u.is_verified as u_is_verified,
  u.organization_type as u_organization_type,
  u.avatar_url as u_avatar_url,
  ea.area_name as ea_area_name,
  co.id as co_id,
  co.full_name as co_full_name
FROM public.social_posts sp
INNER JOIN public.users u ON u.id = sp.author_id
LEFT JOIN public.education_areas ea ON ea.id = sp.area_id
LEFT JOIN public.users co ON co.id = sp.co_author_id
WHERE sp.area_id IS NOT NULL
  AND u.role = 'teacher'
  AND u.is_verified = true;

-- 2. Add Unique Index for Concurrent Refreshes
CREATE UNIQUE INDEX idx_mv_explore_social_posts_id ON public.mv_explore_social_posts (post_id);
CREATE INDEX idx_mv_explore_social_posts_created_at ON public.mv_explore_social_posts (created_at DESC);

-- 3. Create a Function to Refresh the Materialized View
CREATE OR REPLACE FUNCTION public.refresh_mv_explore_social_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_explore_social_posts;
END;
$$;

-- 4. Replace the existing RPC to query the Materialized View instead of live joins
CREATE OR REPLACE FUNCTION public.list_explore_social_posts(
  p_limit int default 30,
  p_query text default null
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  safe_limit int := greatest(1, least(coalesce(p_limit, 30), 50));
  trimmed_query text := nullif(trim(coalesce(p_query, '')), '');
BEGIN
  SELECT coalesce(
    json_agg(row_payload ORDER BY sort_created_at DESC),
    '[]'::json
  )
  INTO result
  FROM (
    SELECT
      jsonb_build_object(
        'id', mv.post_id,
        'created_at', mv.created_at,
        'author_id', mv.author_id,
        'area_id', mv.area_id,
        'caption', mv.caption,
        'media_url', mv.media_url,
        'media_type', mv.media_type,
        'is_reel', mv.is_reel,
        'title', mv.title,
        'content', mv.content,
        'post_type', mv.post_type,
        'author', jsonb_build_object(
          'id', mv.u_id,
          'full_name', mv.u_full_name,
          'role', mv.u_role,
          'is_verified', mv.u_is_verified,
          'organization_type', mv.u_organization_type,
          'avatar_url', mv.u_avatar_url
        ),
        'area', jsonb_build_object('area_name', mv.ea_area_name),
        'co_author', CASE
          WHEN mv.co_id IS NOT NULL THEN jsonb_build_object('id', mv.co_id, 'full_name', mv.co_full_name)
          ELSE NULL
        END
      )::json AS row_payload,
      mv.created_at AS sort_created_at
    FROM public.mv_explore_social_posts mv
    WHERE (
      trimmed_query IS NULL
      OR mv.caption ILIKE '%' || trimmed_query || '%'
      OR mv.title ILIKE '%' || trimmed_query || '%'
      OR mv.u_full_name ILIKE '%' || trimmed_query || '%'
    )
    ORDER BY mv.created_at DESC
    LIMIT safe_limit
  ) subquery;

  RETURN result;
END;
$$;
