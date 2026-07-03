-- Restore Gamification Tables
-- This migration recreates the missing gamification schema that was lost.

create extension if not exists "pgcrypto";

-- Mood Logs

create table if not exists public.mood_logs (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references auth.users(id) on delete cascade,

    mood text not null check (
        mood in ('great', 'good', 'neutral', 'bad', 'terrible')
    ),

    note text,

    logged_at date not null default current_date,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint mood_logs_user_day_unique
        unique (user_id, logged_at)
);

create index if not exists idx_mood_logs_user
on public.mood_logs(user_id);

create index if not exists idx_mood_logs_logged_at
on public.mood_logs(logged_at);

 
-- Challenges

create table if not exists public.challenges (
    id uuid primary key default gen_random_uuid(),

    title text not null unique,

    description text,

    category text not null,

    icon text,

    color text,

    duration_days integer not null default 7,

    target_value integer not null default 1,

    unit text not null default 'times',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

create index if not exists idx_challenges_category
on public.challenges(category);
insert into public.challenges
(title, description, category, icon, duration_days, target_value, unit)
values
('Drink Water', 'Drink enough water every day.', 'Health', '💧', 7, 8, 'glasses'),
('Morning Walk', 'Take a morning walk.', 'Fitness', '🚶', 7, 1, 'walk'),
('Meditation', 'Practice meditation daily.', 'Mindfulness', '🧘', 7, 10, 'minutes'),
('Sleep Well', 'Sleep at least 8 hours.', 'Wellness', '😴', 7, 8, 'hours')
on conflict (title) do nothing;


-- User Challenges

create table if not exists public.user_challenges (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    challenge_id uuid not null
        references public.challenges(id)
        on delete cascade,

    status text not null default 'active'
        check (status in ('active', 'completed', 'abandoned')),

    streak_count integer not null default 0,

    best_streak integer not null default 0,

    started_at timestamptz not null default now(),

    last_checked_in date,

    completed_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint user_challenges_unique
        unique (user_id, challenge_id)
);

create index if not exists idx_user_challenges_user
on public.user_challenges(user_id);

create index if not exists idx_user_challenges_challenge
on public.user_challenges(challenge_id);

create index if not exists idx_user_challenges_status
on public.user_challenges(status);


-- Badges


create table if not exists public.badges (
    id uuid primary key default gen_random_uuid(),

    name text not null unique,

    description text,

    icon text,

    condition_type text not null,

    condition_value integer not null,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

create table if not exists public.user_badges (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    badge_id uuid not null
        references public.badges(id)
        on delete cascade,

    earned_at timestamptz not null default now(),

    created_at timestamptz not null default now(),

    constraint user_badges_unique
        unique (user_id, badge_id)
);

create index if not exists idx_user_badges_user
on public.user_badges(user_id);

create index if not exists idx_user_badges_badge
on public.user_badges(badge_id);


-- Default Badges

insert into public.badges
(name, description, icon, condition_type, condition_value)
values
('First Step', 'Complete your first challenge.', '🥉', 'challenge_complete', 1),
('Consistency', 'Maintain a 7-day streak.', '🔥', 'streak', 7),
('Champion', 'Complete 10 challenges.', '🏆', 'challenge_complete', 10),
('Mood Master', 'Log your mood for 30 days.', '😊', 'mood_logs', 30)
on conflict (name) do nothing;


-- Row Level Security (RLS)


alter table public.mood_logs enable row level security;
alter table public.challenges enable row level security;
alter table public.user_challenges enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;


-- Mood Logs Policies

drop policy if exists "Users can manage their own mood logs"
on public.mood_logs;
create policy "Users can manage their own mood logs"
on public.mood_logs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- Challenges Policies

drop policy if exists "Anyone can view challenges"
on public.challenges;
create policy "Anyone can view challenges"
on public.challenges
for select
using (true);


-- User Challenges Policies

drop policy if exists "Users can manage their own challenges"
on public.user_challenges;
create policy "Users can manage their own challenges"
on public.user_challenges
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- Badges Policies

drop policy if exists "Anyone can view badges"
on public.badges;
create policy "Anyone can view badges"
on public.badges
for select
using (true);

drop policy if exists "Users can view their own badges"
on public.user_badges;
create policy "Users can view their own badges"
on public.user_badges
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own badges"
on public.user_badges;
create policy "Users can insert their own badges"
on public.user_badges
for insert
with check (auth.uid() = user_id);


-- Updated At Trigger

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_mood_logs_updated_at
on public.mood_logs;
create trigger update_mood_logs_updated_at
before update on public.mood_logs
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_challenges_updated_at
on public.challenges;
create trigger update_challenges_updated_at
before update on public.challenges
for each row
execute function public.update_updated_at_column();