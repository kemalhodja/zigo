-- 1. Drop the materialized view and its function
DROP FUNCTION IF EXISTS public.refresh_mv_explore_social_posts;
DROP MATERIALIZED VIEW IF EXISTS public.mv_explore_social_posts CASCADE;

-- 2. Create a standard VIEW that is always up-to-date
CREATE OR REPLACE VIEW public.vw_explore_social_posts AS
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

-- 3. Replace the RPC to query the standard VIEW
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
        'id', v.post_id,
        'created_at', v.created_at,
        'author_id', v.author_id,
        'area_id', v.area_id,
        'caption', v.caption,
        'media_url', v.media_url,
        'media_type', v.media_type,
        'is_reel', v.is_reel,
        'title', v.title,
        'content', v.content,
        'post_type', v.post_type,
        'author', jsonb_build_object(
          'id', v.u_id,
          'full_name', v.u_full_name,
          'role', v.u_role,
          'is_verified', v.u_is_verified,
          'organization_type', v.u_organization_type,
          'avatar_url', v.u_avatar_url
        ),
        'area', jsonb_build_object('area_name', v.ea_area_name),
        'co_author', CASE
          WHEN v.co_id IS NOT NULL THEN jsonb_build_object('id', v.co_id, 'full_name', v.co_full_name)
          ELSE NULL
        END
      )::json AS row_payload,
      v.created_at AS sort_created_at
    FROM public.vw_explore_social_posts v
    WHERE (
      trimmed_query IS NULL
      OR v.caption ILIKE '%' || trimmed_query || '%'
      OR v.title ILIKE '%' || trimmed_query || '%'
      OR v.u_full_name ILIKE '%' || trimmed_query || '%'
    )
    ORDER BY v.created_at DESC
    LIMIT safe_limit
  ) subquery;

  RETURN result;
END;
$$;
