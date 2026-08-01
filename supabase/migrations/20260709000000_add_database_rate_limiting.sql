-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip TEXT PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create atomic rate limiting function
-- Uses INSERT ... ON CONFLICT to avoid TOCTOU race conditions
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  client_ip TEXT,
  max_requests INT,
  window_size_seconds INT
)
RETURNS BOOLEAN AS $$
DECLARE
  new_count INT;
  now_time TIMESTAMPTZ := NOW();
  window_start TIMESTAMPTZ := date_trunc('second', now_time);
BEGIN
  -- Atomic insert-or-increment: no race window between read and write
  INSERT INTO public.rate_limits (ip, request_count, window_start)
  VALUES (client_ip, 1, window_start)
  ON CONFLICT (ip) DO UPDATE SET
    request_count = CASE
      WHEN public.rate_limits.window_start < now_time - (window_size_seconds || ' seconds')::INTERVAL
      THEN 1
      ELSE public.rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN public.rate_limits.window_start < now_time - (window_size_seconds || ' seconds')::INTERVAL
      THEN window_start
      ELSE public.rate_limits.window_start
    END
  RETURNING request_count INTO new_count;

  RETURN new_count <= max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
