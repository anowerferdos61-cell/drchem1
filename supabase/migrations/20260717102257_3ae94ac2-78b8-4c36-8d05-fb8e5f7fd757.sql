-- Lab attempts (persistent progress) + streaks
CREATE TABLE IF NOT EXISTS public.lab_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id text NOT NULL,
  mode text NOT NULL DEFAULT 'student',
  accuracy numeric NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT 'F',
  duration_sec integer NOT NULL DEFAULT 0,
  mistakes_count integer NOT NULL DEFAULT 0,
  steps_completed integer NOT NULL DEFAULT 0,
  steps_total integer NOT NULL DEFAULT 0,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.lab_attempts TO authenticated;
GRANT ALL ON public.lab_attempts TO service_role;

ALTER TABLE public.lab_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students insert own lab attempts"
  ON public.lab_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "students read own lab attempts"
  ON public.lab_attempts FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "teachers read class lab attempts"
  ON public.lab_attempts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.class_members cm
      JOIN public.classes c ON c.id = cm.class_id
      WHERE cm.student_id = lab_attempts.student_id
        AND c.teacher_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS lab_attempts_student_created_idx
  ON public.lab_attempts (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lab_attempts_experiment_idx
  ON public.lab_attempts (experiment_id);

-- Streaks table (server-backed 21-day challenge)
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_days integer NOT NULL DEFAULT 0,
  longest_days integer NOT NULL DEFAULT 0,
  last_check_date date,
  start_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.streaks TO authenticated;
GRANT ALL ON public.streaks TO service_role;

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user manages own streak"
  ON public.streaks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "teachers read class streaks"
  ON public.streaks FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.class_members cm
      JOIN public.classes c ON c.id = cm.class_id
      WHERE cm.student_id = streaks.user_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Atomic streak check-in RPC (advances or resets based on gap)
CREATE OR REPLACE FUNCTION public.streak_checkin()
RETURNS public.streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'utc')::date;
  _row public.streaks;
  _gap integer;
  _next integer;
  _start date;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _row FROM public.streaks WHERE user_id = _uid;

  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, current_days, longest_days, last_check_date, start_date)
    VALUES (_uid, 1, 1, _today, _today)
    RETURNING * INTO _row;
    RETURN _row;
  END IF;

  IF _row.last_check_date = _today THEN
    RETURN _row;
  END IF;

  _gap := _today - COALESCE(_row.last_check_date, _today - 999);

  IF _gap = 1 THEN
    _next := _row.current_days + 1;
    _start := _row.start_date;
  ELSE
    _next := 1;
    _start := _today;
  END IF;

  UPDATE public.streaks
    SET current_days = _next,
        longest_days = GREATEST(_row.longest_days, _next),
        last_check_date = _today,
        start_date = _start,
        updated_at = now()
    WHERE user_id = _uid
    RETURNING * INTO _row;
  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.streak_checkin() TO authenticated;