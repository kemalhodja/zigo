-- Migration: 20260825_game_xp_anti_farm.sql
-- Mini oyun XP anti-farm: gunluk tavan + cooldown sayaclarini users tablosuna ekler.
-- Not: jigsaw_drop game_type izni 110_jigsaw_drop.sql icinde (dosya adindan bagimsiz
-- olarak bu tarihli dosyadan ONCE uygulanmis olur; siralama guvenli).

alter table public.users add column if not exists game_xp_day date;
alter table public.users add column if not exists game_xp_today int not null default 0;
alter table public.users add column if not exists last_game_xp_at timestamptz;

notify pgrst, 'reload schema';
