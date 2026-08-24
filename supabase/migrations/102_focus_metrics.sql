-- Migration: 102_focus_metrics.sql
-- North-star metrik altyapisi: haftalik odak dakika
-- Fix: pomodoro_completed action_type check kisitina eklenmediigi icin
-- pomodoro kayitlari sessizce basarisiz oluyordu.

alter table public.learning_events drop constraint if exists learning_events_action_type_check;

alter table public.learning_events
  add constraint learning_events_action_type_check
  check (action_type in ('reel_watch', 'quiz_complete', 'duel_win', 'focus_session', 'store_visit', 'pomodoro_completed'));

create or replace function public.get_weekly_focus_minutes()
returns table (day date, focus_minutes int, sessions bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d::date as day,
    coalesce(count(le.id), 0) * 25 as focus_minutes,
    count(le.id) as sessions
  from generate_series(current_date - interval '6 day', current_date, interval '1 day') d
  left join learning_events le
    on le.user_id = auth.uid()
   and le.action_type = 'pomodoro_completed'
   and le.created_at::date = d::date
  group by d
  order by d;
$$;

grant execute on function public.get_weekly_focus_minutes() to authenticated;

notify pgrst, 'reload schema';
