-- Add foreign key constraints to user-related tables
-- References Supabase auth.users(id)

-- Profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Symptom History table
ALTER TABLE public.symptom_history
DROP CONSTRAINT IF EXISTS symptom_history_user_id_fkey;

ALTER TABLE public.symptom_history
ADD CONSTRAINT symptom_history_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Health Metrics table
ALTER TABLE public.health_metrics
DROP CONSTRAINT IF EXISTS health_metrics_user_id_fkey;

ALTER TABLE public.health_metrics
ADD CONSTRAINT health_metrics_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Chat Sessions table
ALTER TABLE public.chat_sessions
DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;

ALTER TABLE public.chat_sessions
ADD CONSTRAINT chat_sessions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Create indexes for faster joins
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
ON public.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_symptom_history_user_id_fk
ON public.symptom_history(user_id);

CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id_fk
ON public.health_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id_fk
ON public.chat_sessions(user_id);