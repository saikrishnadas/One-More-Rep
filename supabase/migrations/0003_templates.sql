-- Workout templates
create table if not exists public.workout_templates (
  id uuid primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  exercise_count int default 0,
  created_at timestamptz default now()
);
alter table public.workout_templates enable row level security;
create policy "Users manage own templates" on public.workout_templates
  for all using (auth.uid() = user_id);

-- Template exercises
create table if not exists public.template_exercises (
  id uuid primary key,
  template_id uuid references public.workout_templates(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  exercise_name text not null,
  sets int default 3,
  target_reps int default 10,
  target_weight_kg numeric(6,2) default 0,
  order_index int default 0
);
alter table public.template_exercises enable row level security;
create policy "Users manage own template exercises" on public.template_exercises
  for all using (
    auth.uid() = (select user_id from public.workout_templates where id = template_id)
  );
