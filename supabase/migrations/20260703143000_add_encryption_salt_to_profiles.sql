-- Add encryption_salt column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS encryption_salt TEXT;

-- Recreate trigger function to include encryption_salt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  allergies_arr TEXT[];
  chronic_conditions_arr TEXT[];
BEGIN
  -- Parse allergies array from raw_user_meta_data
  IF NEW.raw_user_meta_data -> 'allergies' IS NOT NULL AND jsonb_typeof(NEW.raw_user_meta_data -> 'allergies') = 'array' THEN
    SELECT COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data -> 'allergies')), '{}'::text[]) INTO allergies_arr;
  ELSE
    allergies_arr := '{}';
  END IF;

  -- Parse chronic conditions array from raw_user_meta_data
  IF NEW.raw_user_meta_data -> 'chronic_conditions' IS NOT NULL AND jsonb_typeof(NEW.raw_user_meta_data -> 'chronic_conditions') = 'array' THEN
    SELECT COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data -> 'chronic_conditions')), '{}'::text[]) INTO chronic_conditions_arr;
  ELSE
    chronic_conditions_arr := '{}';
  END IF;

  INSERT INTO public.profiles (
    user_id,
    full_name,
    date_of_birth,
    gender,
    blood_type,
    allergies,
    chronic_conditions,
    emergency_contact_name,
    emergency_contact_phone,
    encryption_salt
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    (CASE 
      WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL AND NEW.raw_user_meta_data ->> 'date_of_birth' != '' 
      THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::DATE 
      ELSE NULL 
    END),
    NEW.raw_user_meta_data ->> 'gender',
    NEW.raw_user_meta_data ->> 'blood_type',
    allergies_arr,
    chronic_conditions_arr,
    NEW.raw_user_meta_data ->> 'emergency_contact_name',
    NEW.raw_user_meta_data ->> 'emergency_contact_phone',
    NEW.raw_user_meta_data ->> 'encryption_salt'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
