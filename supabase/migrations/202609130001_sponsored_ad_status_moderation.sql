-- Allow 'pending' and 'rejected' in social_posts_sponsored_status_check for admin moderation flow
ALTER TABLE public.social_posts
  DROP CONSTRAINT IF EXISTS social_posts_sponsored_status_check;

ALTER TABLE public.social_posts
  ADD CONSTRAINT social_posts_sponsored_status_check CHECK (
    sponsored_status IS NULL
    OR (sponsored_status::text = ANY (ARRAY['active'::character varying, 'paused'::character varying, 'expired'::character varying, 'pending'::character varying, 'rejected'::character varying]::text[]))
  );
