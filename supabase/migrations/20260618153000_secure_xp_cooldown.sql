-- Add rate limiting columns to public.profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_xp_awarded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS xp_window_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_window_start TIMESTAMP WITH TIME ZONE;

-- Re-create the award_user_xp function with rolling window rate limiting
CREATE OR REPLACE FUNCTION public.award_user_xp(points_to_add INTEGER)
RETURNS void AS $$
DECLARE
  current_user_id UUID;
  current_xp INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
  XP_PER_LEVEL CONSTANT INTEGER := 100;
  
  -- Rate limiting variables
  win_start TIMESTAMP WITH TIME ZONE;
  win_total INTEGER;
BEGIN
  -- Extract authenticated user ID from context
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to award XP';
  END IF;

  -- Validate XP increment input (prevent cheating or negative values)
  IF points_to_add < 0 OR points_to_add > 100 THEN
    RAISE EXCEPTION 'Invalid XP increment amount';
  END IF;

  -- Get current XP and rate limiting state
  SELECT COALESCE(xp, 0), xp_window_start, xp_window_total 
  INTO current_xp, win_start, win_total 
  FROM public.profiles 
  WHERE user_id = current_user_id;

  -- Enforce rolling window rate limit (max 100 XP per 5 minutes)
  IF win_start IS NULL OR win_start < NOW() - INTERVAL '5 minutes' THEN
    -- Reset window
    win_start := NOW();
    win_total := points_to_add;
  ELSE
    -- Increment within window
    win_total := win_total + points_to_add;
    IF win_total > 100 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Maximum 100 XP allowed every 5 minutes.';
    END IF;
  END IF;

  new_xp := current_xp + points_to_add;
  new_level := (new_xp / XP_PER_LEVEL) + 1;

  -- Perform update (bypassing the client-side role check trigger)
  UPDATE public.profiles
  SET xp = new_xp,
      level = new_level,
      last_xp_awarded_at = NOW(),
      xp_window_start = win_start,
      xp_window_total = win_total,
      updated_at = NOW()
  WHERE user_id = current_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
