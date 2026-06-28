
-- ============================================================
-- Subscription System — Phase 1 Schema
-- ============================================================

-- 1. Plans catalog
CREATE TABLE public.subscription_plans (
  code TEXT PRIMARY KEY,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free','student','teacher')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('none','monthly','yearly')),
  price_bdt INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are public" ON public.subscription_plans
  FOR SELECT USING (true);

-- 2. Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES public.subscription_plans(code),
  status TEXT NOT NULL CHECK (status IN ('trialing','active','expired','cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_active_subscription_per_user
  ON public.subscriptions(user_id)
  WHERE status IN ('trialing','active');

CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id);

GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Payment requests (manual bKash MVP)
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES public.subscription_plans(code),
  amount_bdt INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'bkash' CHECK (method IN ('bkash','nagad','sslcommerz')),
  sender_phone TEXT NOT NULL,
  trx_id TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (method, trx_id)
);

CREATE INDEX payment_requests_user_idx ON public.payment_requests(user_id, created_at DESC);
CREATE INDEX payment_requests_status_idx ON public.payment_requests(status, created_at DESC);

GRANT SELECT, INSERT ON public.payment_requests TO authenticated;
GRANT UPDATE ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payment requests" ON public.payment_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users submit own payment requests" ON public.payment_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins view all payment requests" ON public.payment_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update payment requests" ON public.payment_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Daily usage counters (AI tutor quota for free tier)
CREATE TABLE public.usage_counters (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  ai_messages_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_date)
);

GRANT SELECT, INSERT, UPDATE ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage" ON public.usage_counters
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own usage" ON public.usage_counters
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own usage" ON public.usage_counters
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 5. Admin role for app_role enum (if not exists)
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Profile additions: phone verification + trial usage
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_used BOOLEAN NOT NULL DEFAULT false;

-- 7. Seed plans
INSERT INTO public.subscription_plans (code, name_bn, name_en, tier, billing_cycle, price_bdt, duration_days, features) VALUES
  ('free',            'ফ্রি',                'Free',            'free',    'none',    0,    0,
    '{"labs": 2, "ai_messages_per_day": 5, "notes_write": false}'::jsonb),
  ('student_monthly', 'স্টুডেন্ট মাসিক',     'Student Monthly', 'student', 'monthly', 99,   30,
    '{"labs": -1, "ai_messages_per_day": -1, "notes_write": true}'::jsonb),
  ('student_yearly',  'স্টুডেন্ট বার্ষিক',    'Student Yearly',  'student', 'yearly',  999,  365,
    '{"labs": -1, "ai_messages_per_day": -1, "notes_write": true, "discount_pct": 16}'::jsonb),
  ('teacher_monthly', 'টিচার মাসিক',        'Teacher Monthly', 'teacher', 'monthly', 499,  30,
    '{"labs": -1, "ai_messages_per_day": -1, "notes_write": true, "class_size": 40}'::jsonb),
  ('teacher_yearly',  'টিচার বার্ষিক',       'Teacher Yearly',  'teacher', 'yearly',  4990, 365,
    '{"labs": -1, "ai_messages_per_day": -1, "notes_write": true, "class_size": 40, "discount_pct": 17}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name_bn = EXCLUDED.name_bn,
  name_en = EXCLUDED.name_en,
  price_bdt = EXCLUDED.price_bdt,
  features = EXCLUDED.features;
