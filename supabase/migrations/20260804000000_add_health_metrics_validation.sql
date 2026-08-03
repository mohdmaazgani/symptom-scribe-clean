-- Add validation constraints to health_metrics table
-- Issue: https://github.com/mohdmaazgani/symptom-scribe-clean/issues/782
--
-- Prevents future-dated entries and negative metric values from being stored
-- in the database, protecting trend analysis and AI advisory data from corruption.

-- Ensure recorded_at is not in the future
ALTER TABLE health_metrics
ADD CONSTRAINT check_recorded_at_not_future
CHECK (recorded_at <= CURRENT_TIMESTAMP);

-- Document the validation strategy
COMMENT ON TABLE health_metrics IS
'Health metrics table with value validation:

All metric values must be non-negative:
- heart_rate: 30-250 BPM
- temperature: 86-113°F
- weight: 1-500 lbs
- blood_sugar: 20-1000 mg/dL
- oxygen_saturation: 70-100%
- blood_pressure: systolic 50-300, diastolic 30-200

Date validation:
- recorded_at must not be in the future (le CURRENT_TIMESTAMP)
- Prevents future-dated entries from corrupting trend analysis

Violations of these constraints will cause database insert/update to fail
with a descriptive error message, protecting data integrity.';

-- Create helper function to validate metric values
CREATE OR REPLACE FUNCTION validate_health_metric()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check recorded_at is not in future
  IF NEW.recorded_at > CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'recorded_at cannot be in the future';
  END IF;

  -- Validate numeric values in the metric value JSON based on type
  IF NEW.metric_type = 'heart_rate' THEN
    IF (NEW.value->>'value')::numeric < 0 THEN
      RAISE EXCEPTION 'heart_rate value cannot be negative';
    END IF;
  ELSIF NEW.metric_type = 'temperature' THEN
    IF (NEW.value->>'value')::numeric < 0 THEN
      RAISE EXCEPTION 'temperature value cannot be negative';
    END IF;
  ELSIF NEW.metric_type = 'weight' THEN
    IF (NEW.value->>'value')::numeric < 0 THEN
      RAISE EXCEPTION 'weight value cannot be negative';
    END IF;
  ELSIF NEW.metric_type = 'blood_sugar' THEN
    IF (NEW.value->>'value')::numeric < 0 THEN
      RAISE EXCEPTION 'blood_sugar value cannot be negative';
    END IF;
  ELSIF NEW.metric_type = 'oxygen_saturation' THEN
    IF (NEW.value->>'value')::numeric < 0 THEN
      RAISE EXCEPTION 'oxygen_saturation value cannot be negative';
    END IF;
  ELSIF NEW.metric_type = 'blood_pressure' THEN
    IF (NEW.value->>'systolic')::numeric < 0 OR (NEW.value->>'diastolic')::numeric < 0 THEN
      RAISE EXCEPTION 'blood_pressure values cannot be negative';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to validate metrics before insert/update
DROP TRIGGER IF EXISTS validate_health_metric_trigger ON health_metrics;
CREATE TRIGGER validate_health_metric_trigger
BEFORE INSERT OR UPDATE ON health_metrics
FOR EACH ROW
EXECUTE FUNCTION validate_health_metric();
