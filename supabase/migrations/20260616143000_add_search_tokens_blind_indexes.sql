-- Add search_tokens text array columns to symptom_history and health_metrics tables
ALTER TABLE public.symptom_history ADD COLUMN IF NOT EXISTS search_tokens TEXT[];
ALTER TABLE public.health_metrics ADD COLUMN IF NOT EXISTS search_tokens TEXT[];

-- Create GIN indexes for fast searchable blind index lookups
CREATE INDEX IF NOT EXISTS idx_symptom_history_search_tokens ON public.symptom_history USING gin (search_tokens);
CREATE INDEX IF NOT EXISTS idx_health_metrics_search_tokens ON public.health_metrics USING gin (search_tokens);

-- Hardened PL/pgSQL function for search token validation with explicit RLS ownership check
CREATE OR REPLACE FUNCTION public.verify_search_tokens_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access Denied: Cannot modify search tokens for another user account.';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on symptom_history
DROP TRIGGER IF EXISTS trg_verify_symptom_search_tokens ON public.symptom_history;
CREATE TRIGGER trg_verify_symptom_search_tokens
  BEFORE INSERT OR UPDATE ON public.symptom_history
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_search_tokens_ownership();

-- Create trigger on health_metrics
DROP TRIGGER IF EXISTS trg_verify_metrics_search_tokens ON public.health_metrics;
CREATE TRIGGER trg_verify_metrics_search_tokens
  BEFORE INSERT OR UPDATE ON public.health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_search_tokens_ownership();
