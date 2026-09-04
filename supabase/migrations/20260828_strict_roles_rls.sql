-- 1. Enable RLS on core game tracking tables if not already enabled
ALTER TABLE public.game_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing potentially permissive policies on game_daily_usage
DROP POLICY IF EXISTS "Users can read own game usage" ON public.game_daily_usage;
DROP POLICY IF EXISTS "Service role manages game usage" ON public.game_daily_usage;
DROP POLICY IF EXISTS "Users can insert own game usage" ON public.game_daily_usage;
DROP POLICY IF EXISTS "Users can update own game usage" ON public.game_daily_usage;

-- 3. Create STRICT RLS Policies for game_daily_usage
-- Students (or any role) can only read their own usage data
CREATE POLICY "Strict read own game usage" 
ON public.game_daily_usage 
FOR SELECT 
USING (auth.uid() = user_id);

-- Students can insert their own usage data
CREATE POLICY "Strict insert own game usage" 
ON public.game_daily_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Students can update their own usage data
CREATE POLICY "Strict update own game usage" 
ON public.game_daily_usage 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Ensure Users can read their own profile (this often exists, but ensuring strictly)
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- 5. Ensure Users can update their own points/xp
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Ensure Parents can read their children's game settings (if applicable)
-- parent_game_settings RLS
ALTER TABLE public.parent_game_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents manage own game settings" ON public.parent_game_settings;

CREATE POLICY "Strict parents manage own game settings"
ON public.parent_game_settings
FOR ALL
USING (auth.uid() = parent_user_id)
WITH CHECK (auth.uid() = parent_user_id);
