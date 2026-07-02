
CREATE OR REPLACE FUNCTION public.has_active_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('active','trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  ) OR public.has_role(_user_id, 'admin'::public.app_role)
$$;

DROP POLICY IF EXISTS "Authenticated can read notes" ON public.notes;
CREATE POLICY "Authenticated can read notes" ON public.notes
  FOR SELECT TO authenticated
  USING (is_premium = false OR public.has_active_pro(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read videos" ON public.videos;
CREATE POLICY "Authenticated can read videos" ON public.videos
  FOR SELECT TO authenticated
  USING (is_premium = false OR public.has_active_pro(auth.uid()));
