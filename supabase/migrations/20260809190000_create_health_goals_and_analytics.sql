-- Create goals table for Advanced Health Analytics and Goal Setting
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    title TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on goals table
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own goals"
    ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own goals"
    ON public.goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON public.goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Create achievements table for Gamification badges
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT NOT NULL DEFAULT 'Trophy',
    description TEXT NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on achievements table
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own achievements"
    ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own achievements"
    ON public.achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
    ON public.achievements FOR DELETE USING (auth.uid() = user_id);

-- Create PostgreSQL function to aggregate health metrics over time
CREATE OR REPLACE FUNCTION public.get_health_metric_analytics(
    p_user_id UUID,
    p_metric_type TEXT,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    avg_value NUMERIC,
    min_value NUMERIC,
    max_value NUMERIC,
    total_logs INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROUND(AVG((value->>'value')::numeric), 2) AS avg_value,
        MIN((value->>'value')::numeric) AS min_value,
        MAX((value->>'value')::numeric) AS max_value,
        COUNT(*)::INT AS total_logs
    FROM public.health_metrics
    WHERE user_id = p_user_id
      AND metric_type = p_metric_type
      AND recorded_at >= (now() - (p_days || ' days')::INTERVAL);
END;
$$;
