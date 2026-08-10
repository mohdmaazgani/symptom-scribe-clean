-- Add search_tokens text array columns to symptom_history and health_metrics tables
ALTER TABLE public.symptom_history ADD COLUMN IF NOT EXISTS search_tokens TEXT[];
ALTER TABLE public.health_metrics ADD COLUMN IF NOT EXISTS search_tokens TEXT[];

-- Create GIN indexes for fast searchable blind index lookups
CREATE INDEX IF NOT EXISTS idx_symptom_history_search_tokens ON public.symptom_history USING gin (search_tokens);
CREATE INDEX IF NOT EXISTS idx_health_metrics_search_tokens ON public.health_metrics USING gin (search_tokens);
