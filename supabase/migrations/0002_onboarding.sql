-- Extended onboarding profile
create table if not exists public.user_onboarding (
  id uuid primary key references auth.users(id) on delete cascade,
  age int,
  gender text check (gender in ('male','female','other')),
  height_cm numeric(5,1),
  fitness_level text check (fitness_level in ('beginner','intermediate','advanced')),
  session_duration_mins int default 60,
  strong_muscles text[] default '{}',
  weak_muscles text[] default '{}',
  available_equipment text[] default '{}',
  injuries text default '',
  diet_type text check (diet_type in ('any','veg','vegan','keto','non_veg')) default 'any',
  body_fat_pct numeric(4,1),
  target_weight_kg numeric(5,2),
  completed_at timestamptz default now()
);

alter table public.user_onboarding enable row level security;
create policy "Users manage own onboarding" on public.user_onboarding
  for all using (auth.uid() = id);
