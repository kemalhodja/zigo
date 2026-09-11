-- Migration: 122_weekly_league_tiers.sql
-- Duolingo-style haftalık lig sistemi: Bronze -> Silver -> Gold -> Diamond
-- Her Pazartesi 00:00 UTC'de yeni hafta başlar.
-- İlk 5 yükselir, son 5 düşer (30 kişilik bucketlar).

-- Lig tier enum
do $$ begin
  create type weekly_league_tier as enum ('bronze', 'silver', 'gold', 'diamond');
exception when duplicate_object then null;
end $$;

-- Kullanıcıların haftalık lig bucket'ları
create table if not exists public.weekly_league_buckets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  tier          weekly_league_tier not null default 'bronze',
  week_start    date not null,  -- Her haftanın Pazartesi tarihi (UTC)
  points        bigint not null default 0,
  rank          int,            -- Bu haftaki sıra (Pazar hesaplanır)
  promoted_at   timestamptz,    -- Bu tierdan yükseltilme zamanı
  relegated_at  timestamptz,    -- Bu tierdan düşürülme zamanı
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, week_start)
);

-- Performans indeksleri
create index if not exists idx_wlb_tier_week    on public.weekly_league_buckets (tier, week_start);
create index if not exists idx_wlb_user_week    on public.weekly_league_buckets (user_id, week_start desc);
create index if not exists idx_wlb_points_week  on public.weekly_league_buckets (week_start, points desc);

-- RLS
alter table public.weekly_league_buckets enable row level security;

-- Herkes kendi lig bilgisini görebilir
create policy "Users can read league buckets"
  on public.weekly_league_buckets for select
  using (true);

-- Yalnızca sistem (service role) yazabilir
create policy "System writes league buckets"
  on public.weekly_league_buckets for insert
  with check (auth.role() = 'service_role');

create policy "System updates league buckets"
  on public.weekly_league_buckets for update
  using (auth.role() = 'service_role');

-- Mevcut haftanın başlangıcını döner (Pazartesi 00:00 UTC)
create or replace function public.current_week_start()
returns date
language sql stable
set search_path = public
as $$
  select date_trunc('week', now() at time zone 'UTC')::date;
$$;

-- Kullanıcının mevcut hafta tier'ını döner (yoksa 'bronze')
create or replace function public.get_user_league_tier(p_user_id uuid)
returns weekly_league_tier
language sql stable
security definer
set search_path = public
as $$
  select coalesce(
    (select tier from public.weekly_league_buckets
     where user_id = p_user_id
       and week_start = public.current_week_start()
     limit 1),
    'bronze'
  );
$$;

-- Belirli bir tier ve hafta için liderlik tablosu
-- Aynı tier'daki 30 kişilik bucket döner (kullanıcı dahil)
create or replace function public.get_weekly_league_v2(
  p_tier      weekly_league_tier default 'bronze',
  p_week_start date              default null,
  p_limit     int                default 30
)
returns table (
  user_id       uuid,
  full_name     text,
  avatar_url    text,
  tier          weekly_league_tier,
  weekly_points bigint,
  rank          bigint,
  is_promotion_zone  bool,
  is_relegation_zone bool
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      b.user_id,
      u.full_name,
      u.avatar_url,
      b.tier,
      b.points as weekly_points,
      row_number() over (order by b.points desc, b.user_id) as rank,
      count(*) over () as total_count
    from public.weekly_league_buckets b
    join public.users u on u.id = b.user_id
    where b.tier = p_tier
      and b.week_start = coalesce(p_week_start, public.current_week_start())
    limit least(greatest(p_limit, 1), 50)
  )
  select
    user_id,
    full_name,
    avatar_url,
    tier,
    weekly_points,
    rank,
    rank <= 5                           as is_promotion_zone,
    rank > (total_count - 5)            as is_relegation_zone
  from ranked
  order by rank;
$$;

-- Haftalık puanları weekly_league_buckets'a senkronize eder
-- (learning_events tablosundan çekip upsert eder)
create or replace function public.sync_weekly_league_points(p_week_start date default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date := coalesce(p_week_start, public.current_week_start());
  v_week_end   date := v_week_start + interval '7 days';
begin
  insert into public.weekly_league_buckets (user_id, tier, week_start, points)
  select
    u.id as user_id,
    coalesce(
      (select tier from public.weekly_league_buckets
       where user_id = u.id
         and week_start = v_week_start - interval '7 days'
       limit 1),
      'bronze'
    ) as tier,
    v_week_start,
    coalesce(sum(le.points_awarded), 0)::bigint as points
  from public.users u
  left join public.learning_events le
    on le.user_id = u.id
   and le.created_at >= v_week_start
   and le.created_at <  v_week_end
  where u.role = 'student'
  group by u.id
  having coalesce(sum(le.points_awarded), 0) > 0
  on conflict (user_id, week_start)
  do update set
    points     = excluded.points,
    updated_at = now();
end;
$$;

-- Promotion & Relegation işlemi (Her Pazar 23:59'da çalıştırılır)
create or replace function public.process_weekly_promotions_relegations(p_week_start date default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date := coalesce(p_week_start, public.current_week_start());
  v_next_week  date := v_week_start + interval '7 days';
  r record;
begin
  -- Her tier için promotion ve relegation hesapla
  for r in
    select
      user_id,
      tier,
      points,
      row_number() over (partition by tier order by points desc) as rank,
      count(*) over (partition by tier)                          as total
    from public.weekly_league_buckets
    where week_start = v_week_start
  loop
    declare
      v_next_tier weekly_league_tier := r.tier;
      v_promoted  bool := false;
      v_relegated bool := false;
    begin
      -- Promotion: İlk 5 — tier'ı yükselt
      if r.rank <= 5 then
        v_next_tier := case r.tier
          when 'bronze'  then 'silver'::weekly_league_tier
          when 'silver'  then 'gold'::weekly_league_tier
          when 'gold'    then 'diamond'::weekly_league_tier
          else 'diamond'::weekly_league_tier
        end;
        v_promoted := true;
      end if;

      -- Relegation: Son 5 — tier'ı düşür (diamond relegation yok)
      if r.rank > (r.total - 5) and r.tier != 'bronze' and not v_promoted then
        v_next_tier := case r.tier
          when 'silver'  then 'bronze'::weekly_league_tier
          when 'gold'    then 'silver'::weekly_league_tier
          when 'diamond' then 'gold'::weekly_league_tier
          else 'bronze'::weekly_league_tier
        end;
        v_relegated := true;
      end if;

      -- Sonraki haftanın bucket'ını oluştur
      insert into public.weekly_league_buckets (user_id, tier, week_start, points, promoted_at, relegated_at)
      values (
        r.user_id,
        v_next_tier,
        v_next_week,
        0,
        case when v_promoted  then now() else null end,
        case when v_relegated then now() else null end
      )
      on conflict (user_id, week_start) do nothing;

      -- Mevcut haftanın rank'ini güncelle
      update public.weekly_league_buckets
      set rank = r.rank, updated_at = now()
      where user_id = r.user_id and week_start = v_week_start;
    end;
  end loop;
end;
$$;

grant execute on function public.current_week_start()                                         to authenticated;
grant execute on function public.get_user_league_tier(uuid)                                   to authenticated;
grant execute on function public.get_weekly_league_v2(weekly_league_tier, date, int)          to authenticated;
grant execute on function public.sync_weekly_league_points(date)                              to service_role;
grant execute on function public.process_weekly_promotions_relegations(date)                  to service_role;

notify pgrst, 'reload schema';
