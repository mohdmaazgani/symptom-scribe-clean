-- Create dependents table for Family/Dependent profiles
CREATE TABLE IF NOT EXISTS public.dependents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'other',
    date_of_birth TEXT,
    gender TEXT,
    blood_type TEXT,
    allergies TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on dependents table
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dependents table
CREATE POLICY "Primary users can insert their own dependents"
    ON public.dependents
    FOR INSERT
    WITH CHECK (auth.uid() = primary_user_id);

CREATE POLICY "Primary users can view their own dependents"
    ON public.dependents
    FOR SELECT
    USING (auth.uid() = primary_user_id);

CREATE POLICY "Primary users can update their own dependents"
    ON public.dependents
    FOR UPDATE
    USING (auth.uid() = primary_user_id);

CREATE POLICY "Primary users can delete their own dependents"
    ON public.dependents
    FOR DELETE
    USING (auth.uid() = primary_user_id);

-- Add dependent_id column to symptom_history table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'symptom_history' 
        AND column_name = 'dependent_id'
    ) THEN
        ALTER TABLE public.symptom_history 
        ADD COLUMN dependent_id UUID REFERENCES public.dependents(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add dependent_id column to health_metrics table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'health_metrics' 
        AND column_name = 'dependent_id'
    ) THEN
        ALTER TABLE public.health_metrics 
        ADD COLUMN dependent_id UUID REFERENCES public.dependents(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add dependent_id column to documents table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'dependent_id'
    ) THEN
        ALTER TABLE public.documents 
        ADD COLUMN dependent_id UUID REFERENCES public.dependents(id) ON DELETE SET NULL;
    END IF;
END $$;
