-- Step 1: add enum value (must commit before using the new label in PostgreSQL).

DO $$
BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'platform';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
