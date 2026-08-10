-- Security Migration: Fix RLS Bypass Vulnerabilities in Search Token Triggers

-- 1. Ensure SECURITY INVOKER attribute and strict search_path setting on search token trigger function
CREATE OR REPLACE FUNCTION public.verify_search_tokens_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Strict cross-tenant validation: assert current auth.uid matches row user_id
  IF NEW.user_id IS NOT NULL AND auth.uid() IS NOT NULL AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Security Policy Violation: Operation prohibited on unauthorized user payload.';
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Re-apply triggers on symptom_history and health_metrics
DROP TRIGGER IF EXISTS trg_verify_symptom_search_tokens ON public.symptom_history;
CREATE TRIGGER trg_verify_symptom_search_tokens
  BEFORE INSERT OR UPDATE ON public.symptom_history
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_search_tokens_ownership();

DROP TRIGGER IF EXISTS trg_verify_metrics_search_tokens ON public.health_metrics;
CREATE TRIGGER trg_verify_metrics_search_tokens
  BEFORE INSERT OR UPDATE ON public.health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_search_tokens_ownership();
