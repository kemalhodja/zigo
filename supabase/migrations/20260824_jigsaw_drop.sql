-- Migration: 110_jigsaw_drop.sql
-- Yapboz Dususu oyunu icin game_type izni (roadmap oyun salonu genislemesi)

ALTER TABLE public.game_progress DROP CONSTRAINT IF EXISTS game_progress_game_type_check;

ALTER TABLE public.game_progress ADD CONSTRAINT game_progress_game_type_check
CHECK (game_type IN ('memory_card', 'block_puzzle', 'pipe_connect', 'word_hunt', 'zihin_avcisi', 'math_master', 'jigsaw_drop'));
