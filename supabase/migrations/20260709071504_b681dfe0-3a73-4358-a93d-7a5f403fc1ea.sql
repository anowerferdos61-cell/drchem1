
-- Explicit deny: no client (anon/authenticated) may INSERT or UPDATE usage_counters.
-- All writes must go through public.increment_ai_usage() (SECURITY DEFINER, runs as owner).
CREATE POLICY "No client inserts on usage_counters"
  ON public.usage_counters
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "No client updates on usage_counters"
  ON public.usage_counters
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No client deletes on usage_counters"
  ON public.usage_counters
  FOR DELETE
  TO authenticated, anon
  USING (false);
