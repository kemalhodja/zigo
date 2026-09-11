-- Migration: 123_focus_room_competitive.sql
-- Focus odalarını yarışmalı hale getirir.
-- Her kullanıcının tamamladığı Pomodoro blokları izlenir, haftalık oda liderlik tablosu sunulur.

create table if not exists public.focus_room_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  room_slug       text not null,
  block_index     bigint not null,   -- Wall-clock senkron blok numarası
  completed_at    timestamptz not null default now(),
  points_awarded  int not null default 30,
  week_start      date not null default (date_trunc('week', now() at time zone 'UTC')::date),
  unique (user_id, room_slug, block_index)  -- Aynı blok iki kez sayılamaz
);

create index if not exists idx_frs_user_week     on public.focus_room_sessions (user_id, week_start desc);
create index if not exists idx_frs_room_week     on public.focus_room_sessions (room_slug, week_start desc);
create index if not exists idx_frs_completed_at  on public.focus_room_sessions (completed_at desc);

-- RLS
alter table public.focus_room_sessions enable row level security;

create policy "Users read own focus sessions"
  on public.focus_room_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own focus sessions"
  on public.focus_room_sessions for insert
  with check (auth.uid() = user_id);

-- Oda liderlik tablosu: belirtilen oda ve haftadaki top kullanıcılar
create or replace function public.get_room_leaderboard(
  p_slug       text,
  p_week_start date default null,
  p_limit      int  default 10
)
returns table (
  user_id        uuid,
  full_name      text,
  avatar_url     text,
  blocks_completed bigint,
  total_points     bigint,
  rank             bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    frs.user_id,
    u.full_name,
    u.avatar_url,
    count(*)                    as blocks_completed,
    sum(frs.points_awarded)     as total_points,
    row_number() over (order by count(*) desc, sum(frs.points_awarded) desc) as rank
  from public.focus_room_sessions frs
  join public.users u on u.id = frs.user_id
  where frs.room_slug  = p_slug
    and frs.week_start = coalesce(p_week_start, date_trunc('week', now() at time zone 'UTC')::date)
  group by frs.user_id, u.full_name, u.avatar_url
  order by rank
  limit least(greatest(p_limit, 1), 30);
$$;

-- Tek bir blok tamamlama kaydeder (idempotent — aynı block_index tekrar çağrılırsa sessizce geçer)
create or replace function public.complete_focus_block(
  p_user_id    uuid,
  p_room_slug  text,
  p_block_index bigint
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int := 30;
  v_inserted bool := false;
begin
  -- Idempotent upsert
  insert into public.focus_room_sessions (user_id, room_slug, block_index, points_awarded, week_start)
  values (
    p_user_id,
    p_room_slug,
    p_block_index,
    v_points,
    date_trunc('week', now() at time zone 'UTC')::date
  )
  on conflict (user_id, room_slug, block_index) do nothing;

  get diagnostics v_inserted = row_count;

  -- Eğer gerçekten yeni bir kayıt eklendiyse learning_events'e de yaz
  if v_inserted then
    insert into public.learning_events (user_id, event_type, points_awarded, metadata)
    values (
      p_user_id,
      'pomodoro_block_completed',
      v_points,
      jsonb_build_object('room_slug', p_room_slug, 'block_index', p_block_index)
    );
  end if;

  return json_build_object('awarded', v_inserted, 'points', case when v_inserted then v_points else 0 end);
end;
$$;

grant execute on function public.get_room_leaderboard(text, date, int) to authenticated;
grant execute on function public.complete_focus_block(uuid, text, bigint) to authenticated;

notify pgrst, 'reload schema';
