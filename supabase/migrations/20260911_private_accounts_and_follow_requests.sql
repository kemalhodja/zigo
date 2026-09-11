-- Migration: 119_private_accounts_and_follow_requests.sql
-- Add is_private column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create follow_requests table if not exists
CREATE TABLE IF NOT EXISTS public.follow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, target_id)
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_follow_requests_target ON public.follow_requests(target_id, status);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester ON public.follow_requests(requester_id, status);

-- Enable RLS
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

-- Policies for follow_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'select_follow_requests'
  ) THEN
    CREATE POLICY select_follow_requests ON public.follow_requests
      FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'insert_follow_requests'
  ) THEN
    CREATE POLICY insert_follow_requests ON public.follow_requests
      FOR INSERT WITH CHECK (auth.uid() = requester_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'update_follow_requests'
  ) THEN
    CREATE POLICY update_follow_requests ON public.follow_requests
      FOR UPDATE USING (auth.uid() = target_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'delete_follow_requests'
  ) THEN
    CREATE POLICY delete_follow_requests ON public.follow_requests
      FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = target_id);
  END IF;
END $$;
