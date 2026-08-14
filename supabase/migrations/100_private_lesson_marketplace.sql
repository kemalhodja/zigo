-- Migration: 100_private_lesson_marketplace.sql
-- Özel Ders İlan & Teklif Pazaryeri

CREATE TABLE IF NOT EXISTS public.private_lesson_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    child_profile_id uuid REFERENCES public.child_profiles(id) ON DELETE SET NULL,
    area_id integer NOT NULL REFERENCES public.education_areas(id) ON DELETE RESTRICT,
    grade_level text NOT NULL,
    mode text NOT NULL CHECK (mode IN ('online', 'in_person', 'both')),
    city text,
    district text,
    description text NOT NULL,
    budget_try numeric,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
    bids_count integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_private_lesson_posts_area ON public.private_lesson_posts(area_id);
CREATE INDEX IF NOT EXISTS idx_private_lesson_posts_parent ON public.private_lesson_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_private_lesson_posts_status ON public.private_lesson_posts(status);

CREATE TABLE IF NOT EXISTS public.private_lesson_bids (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES public.private_lesson_posts(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    price_per_hour_try numeric NOT NULL,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_teacher_bid_per_post UNIQUE (post_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_private_lesson_bids_post ON public.private_lesson_bids(post_id);
CREATE INDEX IF NOT EXISTS idx_private_lesson_bids_teacher ON public.private_lesson_bids(teacher_id);

-- Trigger to auto-update bids_count and close post when 5 bids are reached
CREATE OR REPLACE FUNCTION public.handle_new_private_lesson_bid()
RETURNS TRIGGER AS $$
DECLARE
    current_count integer;
BEGIN
    SELECT count(*) INTO current_count
    FROM public.private_lesson_bids
    WHERE post_id = NEW.post_id;

    UPDATE public.private_lesson_posts
    SET bids_count = current_count,
        status = CASE WHEN current_count >= 5 THEN 'closed' ELSE status END,
        updated_at = now()
    WHERE id = NEW.post_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_private_lesson_bid_count ON public.private_lesson_bids;
CREATE TRIGGER trg_private_lesson_bid_count
AFTER INSERT OR DELETE ON public.private_lesson_bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_private_lesson_bid();

-- Enable RLS
ALTER TABLE public.private_lesson_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_lesson_bids ENABLE ROW LEVEL SECURITY;

-- Post RLS: Herkes veya ilgili taraflar okuyabilir
CREATE POLICY "Public read open posts"
ON public.private_lesson_posts FOR SELECT
USING (true);

CREATE POLICY "Parents can insert own posts"
ON public.private_lesson_posts FOR INSERT
WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own posts"
ON public.private_lesson_posts FOR UPDATE
USING (parent_id = auth.uid());

-- Bid RLS: Veli kendi ilanına gelen teklifleri, öğretmen kendi verdiği teklifleri görebilir
CREATE POLICY "Users can read relevant bids"
ON public.private_lesson_bids FOR SELECT
USING (
    teacher_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.private_lesson_posts p
        WHERE p.id = private_lesson_bids.post_id AND p.parent_id = auth.uid()
    )
);

CREATE POLICY "Teachers can insert bids"
ON public.private_lesson_bids FOR INSERT
WITH CHECK (teacher_id = auth.uid());
