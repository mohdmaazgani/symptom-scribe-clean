-- Migration for Appointment Management & Documents Storage

-- 1. Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  file_url TEXT,
  file_name TEXT,
  symptom_history_id UUID REFERENCES public.symptom_history(id) ON DELETE SET NULL,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;

-- 4. Create RLS Policies for appointments
CREATE POLICY "appointments_select_policy" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "appointments_insert_policy" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments_update_policy" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "appointments_delete_policy" ON public.appointments
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_symptom_history ON public.appointments(symptom_history_id);

-- 6. Setup Supabase Storage bucket for appointment documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('appointment-documents', 'appointment-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Users can upload appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own appointment files" ON storage.objects;

CREATE POLICY "Users can upload appointment files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'appointment-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view own appointment files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'appointment-documents'
  );

CREATE POLICY "Users can delete own appointment files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'appointment-documents' AND
    auth.role() = 'authenticated'
  );
