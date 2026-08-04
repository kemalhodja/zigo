-- Migration to add co_author_id column to social_posts table

ALTER TABLE public.social_posts
ADD COLUMN IF NOT EXISTS co_author_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- End of migration
