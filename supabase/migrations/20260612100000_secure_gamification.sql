-- 1. Create a function to check and restrict direct updates to 'xp' and 'level' columns by client-side roles
CREATE OR REPLACE FUNCTION public.check_profile_columns_protection()
RETURNS TRIGGER AS $$
BEGIN
  -- If the transaction is executed by standard client roles, check if protected columns are being modified
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.xp IS DISTINCT FROM OLD.xp OR NEW.level IS DISTINCT FROM OLD.level THEN
      RAISE EXCEPTION 'Direct updates to columns (xp, level) are prohibited. Please use the secure rpc.award_user_xp() function.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind the trigger to profiles table
DROP TRIGGER IF EXISTS tr_protect_profile_gamification ON public.profiles;

CREATE TRIGGER tr_protect_profile_gamification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_columns_protection();

-- 3. Create the secure XP award function
CREATE OR REPLACE FUNCTION public.award_user_xp(points_to_add INTEGER)
RETURNS void AS $$
DECLARE
  current_user_id UUID;
  current_xp INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
  XP_PER_LEVEL CONSTANT INTEGER := 100;
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

  -- Get current XP
  SELECT COALESCE(xp, 0) INTO current_xp FROM public.profiles WHERE user_id = current_user_id;

  new_xp := current_xp + points_to_add;
  new_level := (new_xp / XP_PER_LEVEL) + 1;

  -- Perform update (since functions running with SECURITY DEFINER run as the owner - postgres / supabase_admin,
  -- this bypasses the client-side role check trigger)
  UPDATE public.profiles
  SET xp = new_xp,
      level = new_level,
      updated_at = NOW()
  WHERE user_id = current_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
