
-- question_sets
CREATE TABLE public.question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  chapter TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq','cq','mixed')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard','mixed')),
  source_experiment TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_sets TO authenticated;
GRANT ALL ON public.question_sets TO service_role;
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own sets" ON public.question_sets
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Students read published sets in their class" ON public.question_sets
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND class_id IS NOT NULL
    AND public.is_class_member(class_id, auth.uid())
  );

CREATE TRIGGER update_question_sets_updated_at
  BEFORE UPDATE ON public.question_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_question_sets_teacher ON public.question_sets(teacher_id);
CREATE INDEX idx_question_sets_class ON public.question_sets(class_id) WHERE class_id IS NOT NULL;

-- questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('mcq','cq')),
  -- MCQ fields
  question_text TEXT,
  options JSONB,           -- array of 4 strings for mcq
  correct_index INTEGER,   -- 0..3
  explanation TEXT,
  -- CQ fields
  stem TEXT,
  parts JSONB,             -- { ka:{q,marks,sample}, kha:{...}, ga:{...}, gha:{...} }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own set questions" ON public.questions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.question_sets s
    WHERE s.id = questions.set_id
      AND (s.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.question_sets s
    WHERE s.id = questions.set_id
      AND (s.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  ));

CREATE POLICY "Students read questions of published sets in their class" ON public.questions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.question_sets s
    WHERE s.id = questions.set_id
      AND s.status = 'published'
      AND s.class_id IS NOT NULL
      AND public.is_class_member(s.class_id, auth.uid())
  ));

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_questions_set ON public.questions(set_id, order_index);

-- test_attempts
CREATE TABLE public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  mcq_score INTEGER NOT NULL DEFAULT 0,
  mcq_total INTEGER NOT NULL DEFAULT 0,
  cq_score NUMERIC,
  cq_graded_at TIMESTAMPTZ,
  cq_graded_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (set_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_attempts TO authenticated;
GRANT ALL ON public.test_attempts TO service_role;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own attempts" ON public.test_attempts
  FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers read attempts of own sets" ON public.test_attempts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.question_sets s
    WHERE s.id = test_attempts.set_id
      AND (s.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  ));

CREATE POLICY "Teachers update cq scores on own sets" ON public.test_attempts
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.question_sets s
    WHERE s.id = test_attempts.set_id
      AND (s.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  ));

CREATE TRIGGER update_test_attempts_updated_at
  BEFORE UPDATE ON public.test_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_test_attempts_set ON public.test_attempts(set_id);
CREATE INDEX idx_test_attempts_student ON public.test_attempts(student_id);

-- cq_grades
CREATE TABLE public.cq_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  part TEXT NOT NULL CHECK (part IN ('ka','kha','ga','gha')),
  marks_awarded NUMERIC NOT NULL DEFAULT 0,
  ai_similarity_score NUMERIC,
  teacher_note TEXT,
  graded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id, part)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cq_grades TO authenticated;
GRANT ALL ON public.cq_grades TO service_role;
ALTER TABLE public.cq_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage grades on own sets" ON public.cq_grades
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.test_attempts a
    JOIN public.question_sets s ON s.id = a.set_id
    WHERE a.id = cq_grades.attempt_id
      AND (s.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.test_attempts a
    JOIN public.question_sets s ON s.id = a.set_id
    WHERE a.id = cq_grades.attempt_id
      AND (s.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  ));

CREATE POLICY "Students read own grades" ON public.cq_grades
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.test_attempts a
    WHERE a.id = cq_grades.attempt_id AND a.student_id = auth.uid()
  ));

CREATE TRIGGER update_cq_grades_updated_at
  BEFORE UPDATE ON public.cq_grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cq_grades_attempt ON public.cq_grades(attempt_id);
