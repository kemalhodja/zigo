-- Migration to add youtube_url and instagram_url columns to users table and update the profile function

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS youtube_url TEXT CHECK (char_length(youtube_url) <= 2048),
ADD COLUMN IF NOT EXISTS instagram_url TEXT CHECK (char_length(instagram_url) <= 2048);

-- Drop the old functions so we can recreate it with a new signature
DROP FUNCTION IF EXISTS public.update_user_profile(text, text);
DROP FUNCTION IF EXISTS public.update_user_profile(text, text, text);
DROP FUNCTION IF EXISTS public.update_user_profile(text, text, text, text);

CREATE OR REPLACE FUNCTION public.update_user_profile(
  next_bio text default null,
  next_avatar_url text default null,
  next_full_name text default null,
  next_website_url text default null,
  next_youtube_url text default null,
  next_instagram_url text default null
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile public.users;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication is required';
  END IF;

  UPDATE public.users
  SET
    bio = CASE
      WHEN next_bio IS NULL THEN bio
      ELSE nullif(left(trim(next_bio), 500), '')
    END,
    avatar_url = CASE
      WHEN next_avatar_url IS NULL THEN avatar_url
      ELSE nullif(left(trim(next_avatar_url), 500), '')
    END,
    full_name = CASE
      WHEN next_full_name IS NULL THEN full_name
      ELSE coalesce(nullif(left(trim(next_full_name), 100), ''), full_name)
    END,
    website_url = CASE
      WHEN next_website_url IS NULL THEN website_url
      ELSE nullif(left(trim(next_website_url), 2048), '')
    END,
    youtube_url = CASE
      WHEN next_youtube_url IS NULL THEN youtube_url
      ELSE nullif(left(trim(next_youtube_url), 2048), '')
    END,
    instagram_url = CASE
      WHEN next_instagram_url IS NULL THEN instagram_url
      ELSE nullif(left(trim(next_instagram_url), 2048), '')
    END
  WHERE id = auth.uid()
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile was not found';
  END IF;

  RETURN updated_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_profile(text, text, text, text, text, text) TO authenticated;
