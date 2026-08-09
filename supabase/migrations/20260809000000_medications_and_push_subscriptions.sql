-- Migration for Medication Reminders, Adherence Tracking, and Push Subscriptions

-- 1. Create medications table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  times TEXT[] DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create medication_log table
CREATE TABLE IF NOT EXISTS public.medication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'pending')),
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if any
DROP POLICY IF EXISTS "medications_select_policy" ON public.medications;
DROP POLICY IF EXISTS "medications_insert_policy" ON public.medications;
DROP POLICY IF EXISTS "medications_update_policy" ON public.medications;
DROP POLICY IF EXISTS "medications_delete_policy" ON public.medications;

DROP POLICY IF EXISTS "medication_log_select_policy" ON public.medication_log;
DROP POLICY IF EXISTS "medication_log_insert_policy" ON public.medication_log;
DROP POLICY IF EXISTS "medication_log_update_policy" ON public.medication_log;
DROP POLICY IF EXISTS "medication_log_delete_policy" ON public.medication_log;

DROP POLICY IF EXISTS "push_subscriptions_select_policy" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_policy" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update_policy" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_policy" ON public.push_subscriptions;

-- 6. Create RLS Policies for medications
CREATE POLICY "medications_select_policy" ON public.medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medications_insert_policy" ON public.medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medications_update_policy" ON public.medications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "medications_delete_policy" ON public.medications
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS Policies for medication_log
CREATE POLICY "medication_log_select_policy" ON public.medication_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medication_log_insert_policy" ON public.medication_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medication_log_update_policy" ON public.medication_log
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "medication_log_delete_policy" ON public.medication_log
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Create RLS Policies for push_subscriptions
CREATE POLICY "push_subscriptions_select_policy" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert_policy" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_update_policy" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_policy" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_log_user_med ON public.medication_log(user_id, medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_log_scheduled ON public.medication_log(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
