-- Area-scoped student leaderboard for Match-Feed interest peers.

create or replace function public.get_area_leaderboard(
  target_area_id int,
  limit_count int default 10
)
returns table (
  user_id uuid,
  full_name text,
  total_points int,
  rank int
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      u.id as user_id,
      u.full_name,
      coalesce(u.total_points, 0)::int as total_points,
      row_number() over (order by coalesce(u.total_points, 0) desc, u.full_name asc)::int as rank
    from public.users u
    join public.user_interests ui on ui.user_id = u.id
    where u.role = 'student'
      and ui.area_id = target_area_id
  )
  select ranked.user_id, ranked.full_name, ranked.total_points, ranked.rank
  from ranked
  where ranked.rank <= greatest(1, least(coalesce(limit_count, 10), 50));
$$;

grant execute on function public.get_area_leaderboard(int, int) to authenticated;
grant execute on function public.get_area_leaderboard(int, int) to anon;
