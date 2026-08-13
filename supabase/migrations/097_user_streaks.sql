-- Add streak tracking to users
alter table public.users add column if not exists streak_days int not null default 0;
alter table public.users add column if not exists last_active_date date;

-- RPC to update streak on daily login
create or replace function public.update_user_streak()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_last_active date;
  v_streak int;
  v_today date;
  v_points_awarded int := 0;
  v_new_streak int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  v_today := current_date;

  select last_active_date, streak_days into v_last_active, v_streak
  from public.users
  where id = v_user_id;

  -- If already logged in today, do nothing
  if v_last_active = v_today then
    return jsonb_build_object(
      'success', true, 
      'streakIncreased', false, 
      'streak', coalesce(v_streak, 0),
      'pointsAwarded', 0
    );
  end if;

  -- Calculate new streak
  if v_last_active = v_today - interval '1 day' then
    -- Consecutive day
    v_new_streak := coalesce(v_streak, 0) + 1;
  else
    -- Streak broken or first time
    v_new_streak := 1;
  end if;

  -- Points logic: 10 XP daily, +50 XP bonus on every 7th day
  v_points_awarded := 10;
  if v_new_streak % 7 = 0 then
    v_points_awarded := v_points_awarded + 50;
  end if;

  -- Update user record
  update public.users
  set streak_days = v_new_streak,
      last_active_date = v_today,
      total_points = total_points + v_points_awarded
  where id = v_user_id;

  -- Log the event
  insert into public.learning_events (user_id, action_type, points_awarded)
  values (v_user_id, 'daily_streak', v_points_awarded);

  return jsonb_build_object(
    'success', true,
    'streakIncreased', true,
    'streak', v_new_streak,
    'pointsAwarded', v_points_awarded
  );
end;
$$;
