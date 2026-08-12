-- Enable Cross-Device Synchronization Schema Migration

-- 1. Add theme, language, and accessibility_settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{
  "fontSize": "normal",
  "highContrast": false,
  "dyslexiaFont": false,
  "reducedMotion": false,
  "improvedSpacing": false
}'::jsonb;

-- 2. Create user_reminders table for cross-device reminders sync
CREATE TABLE IF NOT EXISTS public.user_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'daily',
    time TEXT NOT NULL, -- HH:mm format
    days TEXT[] DEFAULT '{}',
    enabled BOOLEAN NOT NULL DEFAULT true,
    snooze_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_reminders
ALTER TABLE public.user_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reminders
CREATE POLICY "Users can view their own reminders" 
ON public.user_reminders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" 
ON public.user_reminders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.user_reminders FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.user_reminders FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_reminders_user_id ON public.user_reminders(user_id);

-- 3. Create user_reminder_history table for cross-device reminder history sync
CREATE TABLE IF NOT EXISTS public.user_reminder_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_id UUID REFERENCES public.user_reminders(id) ON DELETE CASCADE,
    reminder_label TEXT NOT NULL,
    fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    action TEXT NOT NULL CHECK (action IN ('fired', 'snoozed', 'dismissed')),
    snooze_minutes INTEGER
);

-- Enable RLS on user_reminder_history
ALTER TABLE public.user_reminder_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reminder_history
CREATE POLICY "Users can view their own reminder history" 
ON public.user_reminder_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminder history" 
ON public.user_reminder_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminder history" 
ON public.user_reminder_history FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_reminder_history_user_id ON public.user_reminder_history(user_id);
