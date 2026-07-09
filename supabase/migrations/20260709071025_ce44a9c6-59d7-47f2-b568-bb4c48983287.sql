
-- Unique phone numbers (partial index — only when phone is set)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON public.profiles (phone)
  WHERE phone IS NOT NULL;

-- Update signup handler to also persist phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _role_text TEXT;
  _phone TEXT;
BEGIN
  _role_text := NEW.raw_user_meta_data->>'role';
  IF _role_text NOT IN ('student','teacher') THEN
    _role_text := 'student';
  END IF;
  _role := _role_text::public.app_role;

  _phone := NULLIF(trim(NEW.raw_user_meta_data->>'phone'), '');

  INSERT INTO public.profiles (user_id, email, display_name, school, class, phone, role_selected)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,''), '@', 1)),
    NEW.raw_user_meta_data->>'school',
    NEW.raw_user_meta_data->>'class',
    _phone,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        school = COALESCE(public.profiles.school, EXCLUDED.school),
        class = COALESCE(public.profiles.class, EXCLUDED.class),
        phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
        role_selected = true,
        updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF NEW.email IS NOT NULL AND lower(NEW.email) = 'anowerferdos61@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Helper: given a BD phone, return the auth email registered to that phone.
-- Public read (needed at login before user is authenticated). Returns NULL if not found.
CREATE OR REPLACE FUNCTION public.get_auth_email_by_phone(_phone text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.phone = _phone
  LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.get_auth_email_by_phone(text) TO anon, authenticated;
