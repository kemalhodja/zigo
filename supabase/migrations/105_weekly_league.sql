-- Migration: 105_weekly_league.sql
-- Sinav sezonu haftalik ligi (roadmap #9): son 7 gunun odak/ogrenme puanlari.

create or replace function public.get_weekly_league(p_limit int default 20)
returns table (user_id uuid, full_name text, avatar_url text, weekly_points bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id as user_id,
    u.full_name,
    u.avatar_url,
    coalesce(sum(le.points_awarded), 0)::bigint as weekly_points
  from users u
  left join learning_events le
    on le.user_id = u.id
   and le.created_at >= now() - interval '7 days'
  where u.role = 'student'
  group by u.id, u.full_name, u.avatar_url
  having coalesce(sum(le.points_awarded), 0) > 0
  order by weekly_points desc, user_id
  limit least(greatest(p_limit, 1), 50);
$$;

grant execute on function public.get_weekly_league(int) to authenticated;

notify pgrst, 'reload schema';
