-- 003_leaderboard_materialized.sql
-- Create a materialized view for student leaderboards to reduce load on the main users table

CREATE MATERIALIZED VIEW public.student_leaderboard_mv AS
SELECT 
    id,
    full_name,
    avatar_url,
    total_points,
    DENSE_RANK() OVER (ORDER BY total_points DESC) as rank
FROM public.users
WHERE role = 'student'
ORDER BY total_points DESC;

-- Index for fast querying
CREATE UNIQUE INDEX idx_student_leaderboard_mv_id ON public.student_leaderboard_mv (id);
CREATE INDEX idx_student_leaderboard_mv_rank ON public.student_leaderboard_mv (rank);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_student_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.student_leaderboard_mv;
END;
$$;

