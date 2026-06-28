
-- Atomic, server-controlled AI usage increment
CREATE OR REPLACE FUNCTION public.increment_ai_usage(_usage_date date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _used integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.usage_counters (user_id, usage_date, ai_messages_used, updated_at)
  VALUES (_uid, _usage_date, 1, now())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    ai_messages_used = public.usage_counters.ai_messages_used + 1,
    updated_at = now()
  RETURNING ai_messages_used INTO _used;

  RETURN _used;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ai_usage(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(date) TO authenticated;

-- Remove direct write access for authenticated users
DROP POLICY IF EXISTS "Users insert own usage" ON public.usage_counters;
DROP POLICY IF EXISTS "Users update own usage" ON public.usage_counters;
REVOKE INSERT, UPDATE, DELETE ON public.usage_counters FROM authenticated;
-- SELECT remains so users can read their own counter via the existing policy
