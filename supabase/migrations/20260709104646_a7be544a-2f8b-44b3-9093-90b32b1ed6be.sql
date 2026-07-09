CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = _class_id
      AND (c.teacher_id = _user_id OR public.has_role(_user_id, 'admin'::public.app_role))
  )
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members cm
    WHERE cm.class_id = _class_id
      AND cm.student_id = _user_id
  )
$$;

REVOKE ALL ON FUNCTION public.is_class_teacher(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_class_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Members can view their class" ON public.classes;
DROP POLICY IF EXISTS "Teachers view own class members" ON public.class_members;
DROP POLICY IF EXISTS "Teachers remove members" ON public.class_members;

CREATE POLICY "Members can view their class"
ON public.classes
FOR SELECT
TO authenticated
USING (public.is_class_member(id, auth.uid()));

CREATE POLICY "Teachers view own class members"
ON public.class_members
FOR SELECT
TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Teachers remove members"
ON public.class_members
FOR DELETE
TO authenticated
USING (public.is_class_teacher(class_id, auth.uid()));