-- supabase/migrations/0001_initial.sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bodyweight_kg numeric(5,2),
  goal text check (goal in ('lose_weight','build_muscle','improve_fitness','powerlifting')),
  training_days_per_week int default 4,
  xp int default 0,
  level int default 1,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Friendships
create table public.friendships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending','accepted','declined')) default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);
alter table public.friendships enable row level security;
create policy "Users can manage own friendships" on public.friendships
  for all using (auth.uid() = user_id or auth.uid() = friend_id);

-- Exercises (global, read-only for users)
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  primary_muscle text not null,
  sub_muscles text[] default '{}',
  equipment text not null,
  instructions text,
  image_url text,
  is_custom boolean default false,
  created_by uuid references public.profiles(id)
);
alter table public.exercises enable row level security;
create policy "Anyone can read exercises" on public.exercises for select using (true);
create policy "Users can insert custom exercises" on public.exercises
  for insert with check (is_custom = true and auth.uid() = created_by);

-- Workout sessions
create table public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int,
  total_volume_kg numeric(10,2) default 0,
  set_count int default 0,
  notes text,
  synced_at timestamptz
);
alter table public.workout_sessions enable row level security;
create policy "Users can manage own sessions" on public.workout_sessions
  for all using (auth.uid() = user_id);

-- Workout sets
create table public.workout_sets (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.workout_sessions(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  set_number int not null,
  weight_kg numeric(6,2) not null,
  reps int not null,
  is_pr boolean default false,
  completed_at timestamptz default now()
);
alter table public.workout_sets enable row level security;
create policy "Users can manage own sets" on public.workout_sets
  for all using (
    auth.uid() = (select user_id from public.workout_sessions where id = session_id)
  );

-- Nutrition logs
create table public.nutrition_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name text not null,
  calories numeric(7,2) not null,
  protein_g numeric(6,2) default 0,
  carbs_g numeric(6,2) default 0,
  fat_g numeric(6,2) default 0,
  fiber_g numeric(6,2) default 0,
  source text default 'manual'
);
alter table public.nutrition_logs enable row level security;
create policy "Users can manage own nutrition" on public.nutrition_logs
  for all using (auth.uid() = user_id);

-- Nutrition goals
create table public.nutrition_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  calories int default 2200,
  protein_g int default 180,
  carbs_g int default 250,
  fat_g int default 70
);
alter table public.nutrition_goals enable row level security;
create policy "Users can manage own nutrition goals" on public.nutrition_goals
  for all using (auth.uid() = user_id);

-- Habits
create table public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text default '🎯',
  habit_type text check (habit_type in ('boolean','count')) default 'boolean',
  target_count int default 1,
  reminder_time time,
  created_at timestamptz default now()
);
alter table public.habits enable row level security;
create policy "Users can manage own habits" on public.habits
  for all using (auth.uid() = user_id);

-- Habit logs
create table public.habit_logs (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  completed boolean default false,
  count_value int default 0,
  unique(habit_id, date)
);
alter table public.habit_logs enable row level security;
create policy "Users can manage own habit logs" on public.habit_logs
  for all using (auth.uid() = user_id);

-- Badges (global)
create table public.badges (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  icon text not null,
  condition_type text not null,
  condition_value int not null
);
alter table public.badges enable row level security;
create policy "Anyone can read badges" on public.badges for select using (true);

-- User badges
create table public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);
alter table public.user_badges enable row level security;
create policy "Users can view own badges" on public.user_badges
  for select using (auth.uid() = user_id);
create policy "Service role inserts badges" on public.user_badges
  for insert with check (auth.uid() = user_id);

-- Goals
create table public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id),
  description text,
  target_weight_kg numeric(6,2),
  target_date date,
  created_at timestamptz default now()
);
alter table public.goals enable row level security;
create policy "Users can manage own goals" on public.goals
  for all using (auth.uid() = user_id);

-- Reactions
create table public.reactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_type text not null,
  target_id uuid not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique(user_id, target_type, target_id)
);
alter table public.reactions enable row level security;
create policy "Users can manage own reactions" on public.reactions
  for all using (auth.uid() = user_id);
create policy "Users can view all reactions" on public.reactions
  for select using (true);
