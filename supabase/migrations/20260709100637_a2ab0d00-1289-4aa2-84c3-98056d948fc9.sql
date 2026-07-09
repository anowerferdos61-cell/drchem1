CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  section text,
  subject text,
  class_code text NOT NULL UNIQUE DEFAULT public.generate_class_code(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_members TO authenticated;
GRANT ALL ON public.class_members TO service_role;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Members can view their class"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.class_id = classes.id AND cm.student_id = auth.uid()
    )
  );

CREATE POLICY "Students view own memberships"
  ON public.class_members FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers view own class members"
  ON public.class_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_members.class_id
        AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

CREATE POLICY "Students can leave"
  ON public.class_members FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers remove members"
  ON public.class_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_members.class_id
        AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

CREATE TRIGGER classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX classes_teacher_id_idx ON public.classes(teacher_id);
CREATE INDEX class_members_class_id_idx ON public.class_members(class_id);
CREATE INDEX class_members_student_id_idx ON public.class_members(student_id);

CREATE OR REPLACE FUNCTION public.join_class(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _class_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO _class_id FROM public.classes
    WHERE class_code = upper(trim(_code)) LIMIT 1;

  IF _class_id IS NULL THEN
    RAISE EXCEPTION 'Invalid class code';
  END IF;

  INSERT INTO public.class_members (class_id, student_id)
  VALUES (_class_id, _uid)
  ON CONFLICT (class_id, student_id) DO NOTHING;

  RETURN _class_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.regenerate_class_code(_class_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _new text;
  _is_owner boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT (teacher_id = _uid) OR public.has_role(_uid, 'admin'::public.app_role)
    INTO _is_owner FROM public.classes WHERE id = _class_id;

  IF NOT COALESCE(_is_owner, false) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  _new := public.generate_class_code();
  UPDATE public.classes SET class_code = _new, updated_at = now() WHERE id = _class_id;
  RETURN _new;
END;
$$;