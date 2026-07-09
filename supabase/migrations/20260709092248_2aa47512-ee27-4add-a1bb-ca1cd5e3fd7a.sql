-- AI usage logs: per-request token & cost tracking for admin observability
CREATE TABLE public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.ai_usage_logs TO service_role;

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins only can read; no client insert (server-only via service role)
CREATE POLICY "Admins can read AI usage logs"
  ON public.ai_usage_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX ai_usage_logs_created_at_idx ON public.ai_usage_logs (created_at DESC);
CREATE INDEX ai_usage_logs_user_id_idx ON public.ai_usage_logs (user_id);