-- Dedicated platform role (education platform accounts no longer map through teacher).

DO $$
BEGIN
  ALTER TYPE public.user_role ADD VALUE 'platform';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.users
SET role = 'platform'::public.user_role
WHERE role = 'teacher'::public.user_role
  AND organization_type = 'egitim_platformu';

CREATE OR REPLACE FUNCTION public.current_user_is_verified_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role IN ('teacher', 'platform')
      AND is_verified = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_verified_teacher(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = p_user_id
      AND u.role IN ('teacher', 'platform')
      AND u.is_verified = true
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.user_role;
  requested_full_name text;
  requested_org_type varchar(32);
BEGIN
  requested_role := CASE
    WHEN new.raw_user_meta_data ->> 'role' IN ('teacher', 'parent', 'student', 'platform')
      THEN (new.raw_user_meta_data ->> 'role')::public.user_role
    ELSE 'student'::public.user_role
  END;

  requested_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  requested_org_type := nullif(trim(coalesce(new.raw_user_meta_data ->> 'organization_type', '')), '');
  IF requested_org_type IS NOT NULL
    AND requested_org_type NOT IN ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu') THEN
    requested_org_type := NULL;
  END IF;

  IF requested_role = 'platform'::public.user_role THEN
    requested_org_type := coalesce(requested_org_type, 'egitim_platformu');
  END IF;

  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    organization_type,
    is_verified,
    total_points
  )
  VALUES (
    new.id,
    coalesce(new.email, ''),
    coalesce(requested_full_name, split_part(coalesce(new.email, 'Zigo User'), '@', 1), 'Zigo User'),
    requested_role,
    requested_org_type,
    false,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP POLICY IF EXISTS "Users can read own profile and verified teachers" ON public.users;
CREATE POLICY "Users can read own profile and verified teachers"
ON public.users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR (role IN ('teacher', 'platform') AND is_verified = true)
);

DROP POLICY IF EXISTS "Users can follow verified teachers" ON public.follows;
CREATE POLICY "Users can follow verified teachers"
ON public.follows
FOR INSERT
TO authenticated
WITH CHECK (
  follower_id = auth.uid()
  AND public.user_is_verified_teacher(following_id)
);
