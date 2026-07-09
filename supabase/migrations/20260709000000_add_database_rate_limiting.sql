-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip TEXT PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create atomic rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  client_ip TEXT,
  max_requests INT,
  window_size_seconds INT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INT;
  current_start TIMESTAMPTZ;
  now_time TIMESTAMPTZ := NOW();
BEGIN
  -- Select the existing rate limit record
  SELECT request_count, window_start INTO current_count, current_start
  FROM public.rate_limits
  WHERE ip = client_ip;

  -- If no record, insert a new one and return true
  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (ip, request_count, window_start)
    VALUES (client_ip, 1, now_time);
    RETURN TRUE;
  END IF;

  -- If window has expired, reset it
  IF current_start < now_time - (window_size_seconds || ' seconds')::INTERVAL THEN
    UPDATE public.rate_limits
    SET request_count = 1, window_start = now_time
    WHERE ip = client_ip;
    RETURN TRUE;
  END IF;

  -- If count is already at or above max_requests, return false
  IF current_count >= max_requests THEN
    RETURN FALSE;
  END IF;

  -- Increment the count
  UPDATE public.rate_limits
  SET request_count = current_count + 1
  WHERE ip = client_ip;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
