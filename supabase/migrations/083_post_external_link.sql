-- Migration to add external_url column to social_posts table

ALTER TABLE public.social_posts
ADD COLUMN IF NOT EXISTS external_url TEXT CHECK (char_length(external_url) <= 2048);
