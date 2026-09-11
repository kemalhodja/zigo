-- Migration: 126_teacher_reviews_and_ratings.sql
-- Öğretmen Veli Değerlendirme & Puanlama Sistemi (Social Proof & Ratings)

CREATE TABLE IF NOT EXISTS public.teacher_reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id uuid REFERENCES public.private_lesson_posts(id) ON DELETE SET NULL,
    rating_clarity smallint NOT NULL CHECK (rating_clarity BETWEEN 1 AND 5),
    rating_communication smallint NOT NULL CHECK (rating_communication BETWEEN 1 AND 5),
    rating_pedagogy smallint NOT NULL CHECK (rating_pedagogy BETWEEN 1 AND 5),
    overall_rating numeric(3,2) GENERATED ALWAYS AS (ROUND((rating_clarity + rating_communication + rating_pedagogy)::numeric / 3.0, 2)) STORED,
    comment text NOT NULL,
    status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_review_per_parent_teacher UNIQUE (teacher_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_reviews_teacher ON public.teacher_reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_status ON public.teacher_reviews(status);

-- RLS
ALTER TABLE public.teacher_reviews ENABLE ROW LEVEL SECURITY;

-- Herkes onaylanmış yorumları görebilir
CREATE POLICY "Public read approved reviews"
ON public.teacher_reviews FOR SELECT
USING (status = 'approved');

-- Veliler kendi yaptıkları yorumu ekleyebilir
CREATE POLICY "Parents can insert own reviews"
ON public.teacher_reviews FOR INSERT
WITH CHECK (
    parent_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'parent'
    )
);

-- Veliler kendi yorumlarını güncelleyebilir
CREATE POLICY "Parents can update own reviews"
ON public.teacher_reviews FOR UPDATE
USING (parent_id = auth.uid());

-- Öğretmen değerlendirme özeti RPC
CREATE OR REPLACE FUNCTION public.get_teacher_review_summary(target_teacher_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_reviews', COALESCE(COUNT(*), 0),
        'avg_rating', COALESCE(ROUND(AVG(overall_rating), 1), 5.0),
        'avg_clarity', COALESCE(ROUND(AVG(rating_clarity), 1), 5.0),
        'avg_communication', COALESCE(ROUND(AVG(rating_communication), 1), 5.0),
        'avg_pedagogy', COALESCE(ROUND(AVG(rating_pedagogy), 1), 5.0),
        'recommendation_rate', CASE 
            WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE overall_rating >= 4.0)::numeric / COUNT(*)::numeric) * 100)
            ELSE 100
        END
    ) INTO result
    FROM public.teacher_reviews
    WHERE teacher_id = target_teacher_id AND status = 'approved';

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
