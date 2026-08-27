-- Migration to add website_url column to users table and update the profile function

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS website_url TEXT CHECK (char_length(website_url) <= 2048);

-- Drop the old function so we can recreate it with a new signature
DROP FUNCTION IF EXISTS public.update_user_profile(text, text);

CREATE OR REPLACE FUNCTION public.update_user_profile(
  next_bio text default null,
  next_avatar_url text default null,
  next_website_url text default null
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
    website_url = CASE
      WHEN next_website_url IS NULL THEN website_url
      ELSE nullif(left(trim(next_website_url), 2048), '')
    END
  WHERE id = auth.uid()
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile was not found';
  END IF;

  RETURN updated_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_profile(text, text, text) TO authenticated;
