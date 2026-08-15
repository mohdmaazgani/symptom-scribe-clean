-- Add nullable images column to symptom_history for attached consultation images
ALTER TABLE public.symptom_history
  ADD COLUMN IF NOT EXISTS images text[];
