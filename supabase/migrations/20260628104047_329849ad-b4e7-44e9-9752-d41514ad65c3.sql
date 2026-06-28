CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _role_text TEXT;
BEGIN
  _role_text := NEW.raw_user_meta_data->>'role';
  IF _role_text NOT IN ('student','teacher') THEN
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
    true
  )
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        school = COALESCE(public.profiles.school, EXCLUDED.school),
        class = COALESCE(public.profiles.class, EXCLUDED.class),
        role_selected = true,
        updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF lower(NEW.email) = 'anowerferdos61@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'student'::public.app_role
FROM public.profiles p
WHERE lower(COALESCE(p.email, '')) <> 'anowerferdos61@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
  )
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::public.app_role
FROM public.profiles p
WHERE lower(COALESCE(p.email, '')) = 'anowerferdos61@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles p
SET role_selected = true,
    updated_at = now()
WHERE role_selected = false
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
  );