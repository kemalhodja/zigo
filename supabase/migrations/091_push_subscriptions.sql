-- 091_push_subscriptions.sql
-- Create a table to store Web Push Subscriptions for users
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a single user doesn't have duplicate endpoints
    UNIQUE (user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own push subscriptions"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own push subscriptions"
    ON public.push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
    ON public.push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all push subscriptions"
    ON public.push_subscriptions FOR SELECT
    USING (public.current_user_is_platform_admin());

-- Trigger for updated_at
CREATE TRIGGER handle_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
