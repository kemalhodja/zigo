create table public.learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action_type text not null check (action_type in ('reel_watch', 'quiz_complete', 'duel_win')),
  target_id uuid not null,
  points_awarded int not null check (points_awarded > 0),
  created_at timestamptz not null default now(),
  constraint learning_events_unique_action unique (user_id, action_type, target_id)
);

create index learning_events_user_created_at_idx
on public.learning_events (user_id, created_at desc);

alter table public.learning_events enable row level security;

create policy "Users can read own learning events"
on public.learning_events
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create own learning events"
on public.learning_events
for insert
to authenticated
with check (user_id = auth.uid());

create or replace function public.award_social_reel_watch_points(
  p_target_user_id uuid,
  p_target_id uuid,
  p_points int
)
returns table (
  event_id uuid,
  points_awarded int,
  already_awarded boolean,
  total_points int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event public.learning_events%rowtype;
  current_total int;
begin
  if auth.uid() is null or auth.uid() <> p_target_user_id then
    raise exception 'not authorized';
  end if;

  insert into public.learning_events (user_id, action_type, target_id, points_awarded)
  values (p_target_user_id, 'reel_watch', p_target_id, p_points)
  on conflict (user_id, action_type, target_id) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    select users.total_points into current_total
    from public.users
    where users.id = p_target_user_id;

    return query
    select
      null::uuid,
      0,
      true,
      coalesce(current_total, 0);
    return;
  end if;

  update public.users
  set total_points = total_points + p_points
  where users.id = p_target_user_id
  returning users.total_points into current_total;

  return query
  select
    inserted_event.id,
    inserted_event.points_awarded,
    false,
    coalesce(current_total, 0);
end;
$$;
