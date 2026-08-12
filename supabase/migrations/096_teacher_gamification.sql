-- 096_teacher_gamification.sql
-- Eğitmenler için Teşvik / Gamification (Zigo Puan) Sistemi

-- 1. Öğretmenler için Materialized View (Liderlik Tablosu)
CREATE MATERIALIZED VIEW public.teacher_leaderboard_mv AS
SELECT 
    id,
    full_name,
    avatar_url,
    total_points,
    DENSE_RANK() OVER (ORDER BY total_points DESC) as rank
FROM public.users
WHERE role = 'teacher'
ORDER BY total_points DESC;

-- Refresh fonksiyonu
CREATE OR REPLACE FUNCTION public.refresh_teacher_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.teacher_leaderboard_mv;
END;
$$;

-- İndeksler (Sorgu Hızlandırmak için)
CREATE UNIQUE INDEX idx_teacher_leaderboard_mv_id ON public.teacher_leaderboard_mv (id);
CREATE INDEX idx_teacher_leaderboard_mv_rank ON public.teacher_leaderboard_mv (rank);

-- 2. Post Atıldığında Öğretmene Puan Verme Trigger'ı (+10 Puan)
CREATE OR REPLACE FUNCTION public.reward_teacher_for_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role text;
BEGIN
    -- Sadece ekleme (insert) işleminde
    SELECT role::text INTO v_role FROM public.users WHERE id = NEW.author_id;
    
    IF v_role = 'teacher' THEN
        UPDATE public.users 
        SET total_points = total_points + 10 
        WHERE id = NEW.author_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_reward_teacher_post ON public.social_posts;
CREATE TRIGGER trigger_reward_teacher_post
    AFTER INSERT ON public.social_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.reward_teacher_for_post();

-- 3. Post Beğenildiğinde Öğretmene Puan Verme Trigger'ı (+1 Puan)
CREATE OR REPLACE FUNCTION public.reward_teacher_for_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_author_id uuid;
    v_role text;
BEGIN
    -- Beğenilen postun yazarını bul
    SELECT author_id INTO v_author_id FROM public.social_posts WHERE id = NEW.post_id;
    
    IF v_author_id IS NOT NULL THEN
        SELECT role::text INTO v_role FROM public.users WHERE id = v_author_id;
        
        -- Yazar öğretmense puan ver
        IF v_role = 'teacher' THEN
            UPDATE public.users 
            SET total_points = total_points + 1 
            WHERE id = v_author_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_reward_teacher_like ON public.post_likes;
CREATE TRIGGER trigger_reward_teacher_like
    AFTER INSERT ON public.post_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.reward_teacher_for_like();
