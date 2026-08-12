-- Migration for Community and Social Sharing feature

-- Add community settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS community_opt_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS community_visible BOOLEAN DEFAULT TRUE;

-- Create support groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  anonymous_alias TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_group UNIQUE (user_id, group_id)
);

-- Create group posts table
CREATE TABLE IF NOT EXISTS public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('achievement', 'question')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reported posts table for content moderation
CREATE TABLE IF NOT EXISTS public.reported_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all community tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reported_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups (all authenticated users can read groups, authenticated users can insert/update if needed)
CREATE POLICY "Anyone can view groups" ON public.groups
  FOR SELECT USING (true);

-- RLS Policies for group_members
CREATE POLICY "Users can view members of groups they belong to or all group memberships" ON public.group_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for group_posts
CREATE POLICY "Users can view posts in groups" ON public.group_posts
  FOR SELECT USING (true);

CREATE POLICY "Members can insert posts" ON public.group_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.group_posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reported_posts
CREATE POLICY "Users can report posts" ON public.reported_posts
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON public.reported_posts
  FOR SELECT USING (auth.uid() = reporter_id);

-- Seed initial support groups
INSERT INTO public.groups (id, name, description, topic)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'Hydration & Daily Goals', 'Share your daily water intake achievements and hydration tips anonymously!', 'Hydration'),
  ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'Heart Health & Active Living', 'Community for sharing heart-healthy achievements, cardio milestones, and questions.', 'Cardio Health'),
  ('a1b2c3d4-e5f6-7890-abcd-333333333333', 'Nutrition & Healthy Eating', 'Discuss meal planning, low-sugar recipes, and nutrition achievements anonymously.', 'Nutrition'),
  ('a1b2c3d4-e5f6-7890-abcd-444444444444', 'Mindful Living & Stress Relief', 'A safe space for stress management, meditation milestones, and mental health tips.', 'Mental Wellness'),
  ('a1b2c3d4-e5f6-7890-abcd-555555555555', 'Sleep & Recovery Circle', 'Track sleep habits, night-time routines, and rest goals with supportive peers.', 'Sleep Health')
ON CONFLICT (id) DO NOTHING;
