-- Migration for AI Mentor Logs

CREATE TABLE IF NOT EXISTS public.ai_mentor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  advice_text TEXT NOT NULL,
  context_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_mentor_logs_user_idx ON public.ai_mentor_logs (user_id, created_at DESC);

ALTER TABLE public.ai_mentor_logs ENABLE ROW LEVEL SECURITY;

drop policy if exists "Allow read own ai logs" ON public.ai_mentor_logs;
CREATE POLICY "Allow read own ai logs" ON public.ai_mentor_logs
  FOR SELECT USING (auth.uid() = user_id);

-- End of migration
