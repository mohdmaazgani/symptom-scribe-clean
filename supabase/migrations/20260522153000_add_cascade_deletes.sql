-- 1. Clean up any existing orphaned records first
DELETE FROM public.profiles WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.symptom_history WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.health_metrics WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.chat_sessions WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 2. Add foreign key constraints with ON DELETE CASCADE
ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.symptom_history 
  ADD CONSTRAINT fk_symptom_history_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.health_metrics 
  ADD CONSTRAINT fk_health_metrics_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.chat_sessions 
  ADD CONSTRAINT fk_chat_sessions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
