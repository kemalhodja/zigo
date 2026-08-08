-- Migration: create user_subscriptions table

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
    started_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    receipt_token text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
