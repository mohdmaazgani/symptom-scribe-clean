-- Add nullable images column to symptom_history so attached chat images can be persisted
ALTER TABLE public.symptom_history ADD COLUMN IF NOT EXISTS images TEXT[];
