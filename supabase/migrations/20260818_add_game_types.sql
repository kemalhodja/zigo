-- Mevcut game_type kısıtlamasını kaldır
ALTER TABLE game_progress DROP CONSTRAINT IF EXISTS game_progress_game_type_check;

-- Yeni oyunları da içerecek şekilde kısıtlamayı tekrar ekle
ALTER TABLE game_progress ADD CONSTRAINT game_progress_game_type_check 
CHECK (game_type IN ('memory_card', 'block_puzzle', 'pipe_connect', 'word_hunt', 'zihin_avcisi', 'math_master'));
