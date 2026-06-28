
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_selected boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET role_selected = true WHERE role_selected = false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _role_text TEXT;
  _had_role BOOLEAN;
BEGIN
  _role_text := NEW.raw_user_meta_data->>'role';
  _had_role := _role_text IS NOT NULL AND _role_text IN ('student','teacher');
  IF NOT _had_role THEN
    _role_text := 'student';
  END IF;
  _role := _role_text::public.app_role;

  INSERT INTO public.profiles (user_id, email, display_name, school, class, role_selected)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'school',
    NEW.raw_user_meta_data->>'class',
    _had_role
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Admin: grant a subscription plan to any user
CREATE OR REPLACE FUNCTION public.admin_grant_subscription(_user_id uuid, _plan_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _days int;
  _now timestamptz := now();
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT duration_days INTO _days FROM public.subscription_plans WHERE code = _plan_code;
  IF _days IS NULL THEN
    RAISE EXCEPTION 'Invalid plan: %', _plan_code;
  END IF;

  UPDATE public.subscriptions
    SET status = 'expired'
    WHERE user_id = _user_id AND status IN ('trialing','active');

  INSERT INTO public.subscriptions (user_id, plan_code, status, started_at, current_period_end)
  VALUES (_user_id, _plan_code, 'active', _now, _now + (_days || ' days')::interval);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_grant_subscription(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_subscription(uuid, text) TO authenticated;
