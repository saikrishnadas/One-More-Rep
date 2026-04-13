import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Local mirror of profiles
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  avatarUrl: text('avatar_url'),
  bodyweightKg: real('bodyweight_kg'),
  goal: text('goal'),
  trainingDaysPerWeek: integer('training_days_per_week').default(4),
  xp: integer('xp').default(0),
  level: integer('level').default(1),
});

// Local exercise cache (seeded from Supabase on first launch)
export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  primaryMuscle: text('primary_muscle').notNull(),
  subMuscles: text('sub_muscles').notNull().default('[]'), // JSON array
  equipment: text('equipment').notNull(),
  instructions: text('instructions'),
  imageUrl: text('image_url'),
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false),
});

// Local workout sessions (source of truth, syncs to Supabase)
export const workoutSessions = sqliteTable('workout_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name'),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
  durationSeconds: integer('duration_seconds'),
  totalVolumeKg: real('total_volume_kg').default(0),
  setCount: integer('set_count').default(0),
  notes: text('notes'),
  syncedAt: integer('synced_at', { mode: 'timestamp_ms' }),
  sessionRpe: real('session_rpe'),
  caloriesBurned: integer('calories_burned'),
});

// Local workout sets
export const workoutSets = sqliteTable('workout_sets', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  setNumber: integer('set_number').notNull(),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  isPr: integer('is_pr', { mode: 'boolean' }).default(false),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  rpe: real('rpe'),  // nullable, 1-10
});

// Local nutrition logs
export const nutritionLogs = sqliteTable('nutrition_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(), // 'YYYY-MM-DD'
  mealType: text('meal_type'),
  foodName: text('food_name').notNull(),
  calories: real('calories').notNull(),
  proteinG: real('protein_g').default(0),
  carbsG: real('carbs_g').default(0),
  fatG: real('fat_g').default(0),
  fiberG: real('fiber_g').default(0),
  source: text('source').default('manual'),
  syncedAt: integer('synced_at', { mode: 'timestamp_ms' }),
});

// Local nutrition goals
export const nutritionGoals = sqliteTable('nutrition_goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  calories: integer('calories').default(2200),
  proteinG: integer('protein_g').default(180),
  carbsG: integer('carbs_g').default(250),
  fatG: integer('fat_g').default(70),
});

// Local habits
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon').default('🎯'),
  habitType: text('habit_type').default('boolean'),
  targetCount: integer('target_count').default(1),
  reminderTime: text('reminder_time'), // 'HH:MM'
});

// Local habit logs
export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(), // 'YYYY-MM-DD'
  completed: integer('completed', { mode: 'boolean' }).default(false),
  countValue: integer('count_value').default(0),
  syncedAt: integer('synced_at', { mode: 'timestamp_ms' }),
});

// Workout templates
export const workoutTemplates = sqliteTable('workout_templates', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  exerciseCount: integer('exercise_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

// Template exercises (ordered)
export const templateExercises = sqliteTable('template_exercises', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  exerciseName: text('exercise_name').notNull(),
  sets: integer('sets').default(3),
  targetReps: integer('target_reps').default(10),
  targetWeightKg: real('target_weight_kg').default(0),
  orderIndex: integer('order_index').default(0),
});

export const bodyMeasurements = sqliteTable('body_measurements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(), // 'YYYY-MM-DD'
  weightKg: real('weight_kg'),
  chestCm: real('chest_cm'),
  waistCm: real('waist_cm'),
  hipsCm: real('hips_cm'),
  armsCm: real('arms_cm'),
  thighsCm: real('thighs_cm'),
  neckCm: real('neck_cm'),
  heightCm: real('height_cm'),
  bodyFatPct: real('body_fat_pct'),
  notes: text('notes'),
});

export const mealTemplates = sqliteTable('meal_templates', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  calories: real('calories').notNull(),
  proteinG: real('protein_g').default(0),
  carbsG: real('carbs_g').default(0),
  fatG: real('fat_g').default(0),
  fiberG: real('fiber_g').default(0),
  mealType: text('meal_type'),
  usageCount: integer('usage_count').default(0),
});

export const cheatDayLogs = sqliteTable('cheat_day_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
  plannedVsActual: text('planned_vs_actual').default('planned'),
  guilt: integer('guilt').default(0),
});

export const progressPhotos = sqliteTable('progress_photos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  localUri: text('local_uri').notNull(),
  notes: text('notes'),
  weight: real('weight'),
});
