# Phase 2: Workout Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full active workout tracking experience — start a session, add exercises, log sets, detect PRs, finish with a summary screen, and sync to Supabase.

**Architecture:** Offline-first: all workout data is written to local SQLite (via Drizzle) during the session, then synced to Supabase on finish. Active session state lives in a Zustand store. The exercise database is seeded from a local TypeScript data file into SQLite on first launch.

**Tech Stack:** React Native, Expo Router, Zustand, Drizzle ORM, expo-sqlite, Supabase, expo-crypto (UUID), react-native-safe-area-context

---

## File Map

```
app/
  active-workout.tsx            # Main screen: live timer, exercise list, add exercise
  workout-summary.tsx           # Post-workout: volume, XP, PRs, muscle breakdown
  (tabs)/
    workout.tsx                 # History: list of past sessions (replaces shell)

src/
  data/
    exercises.ts                # Static seed data: ~80 exercises with muscle/equipment
  db/
    seed.ts                     # seedExercises(): writes exercises to SQLite if empty
  stores/
    workout.ts                  # Zustand: active session state, set tracking, timer
  components/
    workout/
      SetRow.tsx                # One row per set: weight input, reps input, checkoff
      ExerciseBlock.tsx         # One exercise card: name, sets list, add set button
      ExerciseSearchModal.tsx   # Full-screen modal: search + muscle/equipment filters
      RestTimer.tsx             # Countdown overlay after completing a set
  lib/
    workout-sync.ts             # pushWorkoutToSupabase(sessionId): sync after finish
```

---

## Task 1: Exercise seed data

**Files:**
- Create: `src/data/exercises.ts`
- Create: `src/db/seed.ts`
- Modify: `app/_layout.tsx` (call seedExercises after initDatabase)

- [ ] **Step 1.1: Create exercise data file**

Create `src/data/exercises.ts`:

```typescript
export interface ExerciseData {
  id: string;
  name: string;
  primaryMuscle: string;
  subMuscles: string[];
  equipment: string;
}

export const EXERCISES: ExerciseData[] = [
  // CHEST
  { id: 'ex-001', name: 'Barbell Bench Press',       primaryMuscle: 'chest',     subMuscles: ['front_delts','triceps'],          equipment: 'barbell' },
  { id: 'ex-002', name: 'Incline Barbell Press',     primaryMuscle: 'chest',     subMuscles: ['upper_chest','front_delts'],      equipment: 'barbell' },
  { id: 'ex-003', name: 'Decline Barbell Press',     primaryMuscle: 'chest',     subMuscles: ['lower_chest','triceps'],          equipment: 'barbell' },
  { id: 'ex-004', name: 'Dumbbell Bench Press',      primaryMuscle: 'chest',     subMuscles: ['front_delts','triceps'],          equipment: 'dumbbell' },
  { id: 'ex-005', name: 'Incline Dumbbell Press',    primaryMuscle: 'chest',     subMuscles: ['upper_chest','front_delts'],      equipment: 'dumbbell' },
  { id: 'ex-006', name: 'Dumbbell Flye',             primaryMuscle: 'chest',     subMuscles: ['front_delts'],                   equipment: 'dumbbell' },
  { id: 'ex-007', name: 'Cable Crossover',           primaryMuscle: 'chest',     subMuscles: ['front_delts'],                   equipment: 'cable' },
  { id: 'ex-008', name: 'Chest Dip',                 primaryMuscle: 'chest',     subMuscles: ['lower_chest','triceps'],          equipment: 'bodyweight' },
  { id: 'ex-009', name: 'Push Up',                   primaryMuscle: 'chest',     subMuscles: ['front_delts','triceps'],          equipment: 'bodyweight' },
  { id: 'ex-010', name: 'Machine Chest Press',       primaryMuscle: 'chest',     subMuscles: ['front_delts','triceps'],          equipment: 'machine' },
  // BACK
  { id: 'ex-011', name: 'Deadlift',                  primaryMuscle: 'back',      subMuscles: ['lats','traps','glutes','hamstrings'], equipment: 'barbell' },
  { id: 'ex-012', name: 'Barbell Row',               primaryMuscle: 'back',      subMuscles: ['lats','rhomboids','biceps'],      equipment: 'barbell' },
  { id: 'ex-013', name: 'Pull Up',                   primaryMuscle: 'back',      subMuscles: ['lats','biceps'],                 equipment: 'bodyweight' },
  { id: 'ex-014', name: 'Chin Up',                   primaryMuscle: 'back',      subMuscles: ['lats','biceps'],                 equipment: 'bodyweight' },
  { id: 'ex-015', name: 'Lat Pulldown',              primaryMuscle: 'back',      subMuscles: ['lats','biceps'],                 equipment: 'cable' },
  { id: 'ex-016', name: 'Seated Cable Row',          primaryMuscle: 'back',      subMuscles: ['rhomboids','biceps','traps'],     equipment: 'cable' },
  { id: 'ex-017', name: 'Single-Arm Dumbbell Row',   primaryMuscle: 'back',      subMuscles: ['lats','rhomboids','biceps'],      equipment: 'dumbbell' },
  { id: 'ex-018', name: 'T-Bar Row',                 primaryMuscle: 'back',      subMuscles: ['lats','rhomboids','traps'],       equipment: 'barbell' },
  { id: 'ex-019', name: 'Face Pull',                 primaryMuscle: 'back',      subMuscles: ['rear_delts','traps','rhomboids'], equipment: 'cable' },
  { id: 'ex-020', name: 'Rack Pull',                 primaryMuscle: 'back',      subMuscles: ['traps','glutes'],                equipment: 'barbell' },
  // SHOULDERS
  { id: 'ex-021', name: 'Overhead Press',            primaryMuscle: 'shoulders', subMuscles: ['front_delts','triceps','traps'],  equipment: 'barbell' },
  { id: 'ex-022', name: 'Dumbbell Shoulder Press',   primaryMuscle: 'shoulders', subMuscles: ['front_delts','triceps'],          equipment: 'dumbbell' },
  { id: 'ex-023', name: 'Lateral Raise',             primaryMuscle: 'shoulders', subMuscles: ['side_delts'],                    equipment: 'dumbbell' },
  { id: 'ex-024', name: 'Cable Lateral Raise',       primaryMuscle: 'shoulders', subMuscles: ['side_delts'],                    equipment: 'cable' },
  { id: 'ex-025', name: 'Front Raise',               primaryMuscle: 'shoulders', subMuscles: ['front_delts'],                   equipment: 'dumbbell' },
  { id: 'ex-026', name: 'Rear Delt Flye',            primaryMuscle: 'shoulders', subMuscles: ['rear_delts','rhomboids'],         equipment: 'dumbbell' },
  { id: 'ex-027', name: 'Arnold Press',              primaryMuscle: 'shoulders', subMuscles: ['front_delts','side_delts'],       equipment: 'dumbbell' },
  { id: 'ex-028', name: 'Upright Row',               primaryMuscle: 'shoulders', subMuscles: ['traps','side_delts'],             equipment: 'barbell' },
  // BICEPS
  { id: 'ex-029', name: 'Barbell Curl',              primaryMuscle: 'biceps',    subMuscles: ['forearms'],                      equipment: 'barbell' },
  { id: 'ex-030', name: 'Dumbbell Curl',             primaryMuscle: 'biceps',    subMuscles: ['forearms'],                      equipment: 'dumbbell' },
  { id: 'ex-031', name: 'Hammer Curl',               primaryMuscle: 'biceps',    subMuscles: ['brachialis','forearms'],          equipment: 'dumbbell' },
  { id: 'ex-032', name: 'Incline Dumbbell Curl',     primaryMuscle: 'biceps',    subMuscles: ['long_head'],                     equipment: 'dumbbell' },
  { id: 'ex-033', name: 'Cable Curl',                primaryMuscle: 'biceps',    subMuscles: ['forearms'],                      equipment: 'cable' },
  { id: 'ex-034', name: 'Preacher Curl',             primaryMuscle: 'biceps',    subMuscles: ['short_head'],                    equipment: 'machine' },
  { id: 'ex-035', name: 'Concentration Curl',        primaryMuscle: 'biceps',    subMuscles: ['short_head'],                    equipment: 'dumbbell' },
  // TRICEPS
  { id: 'ex-036', name: 'Close-Grip Bench Press',    primaryMuscle: 'triceps',   subMuscles: ['chest','front_delts'],           equipment: 'barbell' },
  { id: 'ex-037', name: 'Tricep Pushdown',           primaryMuscle: 'triceps',   subMuscles: [],                                equipment: 'cable' },
  { id: 'ex-038', name: 'Overhead Tricep Extension', primaryMuscle: 'triceps',   subMuscles: ['long_head'],                     equipment: 'dumbbell' },
  { id: 'ex-039', name: 'Skull Crusher',             primaryMuscle: 'triceps',   subMuscles: ['long_head'],                     equipment: 'barbell' },
  { id: 'ex-040', name: 'Tricep Dip',                primaryMuscle: 'triceps',   subMuscles: ['chest'],                         equipment: 'bodyweight' },
  { id: 'ex-041', name: 'Diamond Push Up',           primaryMuscle: 'triceps',   subMuscles: ['chest'],                         equipment: 'bodyweight' },
  // QUADS
  { id: 'ex-042', name: 'Back Squat',                primaryMuscle: 'quads',     subMuscles: ['glutes','hamstrings'],            equipment: 'barbell' },
  { id: 'ex-043', name: 'Front Squat',               primaryMuscle: 'quads',     subMuscles: ['glutes'],                        equipment: 'barbell' },
  { id: 'ex-044', name: 'Leg Press',                 primaryMuscle: 'quads',     subMuscles: ['glutes','hamstrings'],            equipment: 'machine' },
  { id: 'ex-045', name: 'Hack Squat',                primaryMuscle: 'quads',     subMuscles: ['glutes'],                        equipment: 'machine' },
  { id: 'ex-046', name: 'Leg Extension',             primaryMuscle: 'quads',     subMuscles: [],                                equipment: 'machine' },
  { id: 'ex-047', name: 'Bulgarian Split Squat',     primaryMuscle: 'quads',     subMuscles: ['glutes','hamstrings'],            equipment: 'dumbbell' },
  { id: 'ex-048', name: 'Lunge',                     primaryMuscle: 'quads',     subMuscles: ['glutes','hamstrings'],            equipment: 'dumbbell' },
  // HAMSTRINGS / GLUTES
  { id: 'ex-049', name: 'Romanian Deadlift',         primaryMuscle: 'hamstrings',subMuscles: ['glutes','lower_back'],            equipment: 'barbell' },
  { id: 'ex-050', name: 'Leg Curl',                  primaryMuscle: 'hamstrings',subMuscles: [],                                equipment: 'machine' },
  { id: 'ex-051', name: 'Good Morning',              primaryMuscle: 'hamstrings',subMuscles: ['lower_back','glutes'],            equipment: 'barbell' },
  { id: 'ex-052', name: 'Hip Thrust',                primaryMuscle: 'glutes',    subMuscles: ['hamstrings'],                    equipment: 'barbell' },
  { id: 'ex-053', name: 'Cable Kickback',            primaryMuscle: 'glutes',    subMuscles: ['hamstrings'],                    equipment: 'cable' },
  { id: 'ex-054', name: 'Sumo Deadlift',             primaryMuscle: 'glutes',    subMuscles: ['hamstrings','quads'],             equipment: 'barbell' },
  // CALVES
  { id: 'ex-055', name: 'Standing Calf Raise',       primaryMuscle: 'calves',    subMuscles: ['soleus'],                        equipment: 'machine' },
  { id: 'ex-056', name: 'Seated Calf Raise',         primaryMuscle: 'calves',    subMuscles: ['soleus'],                        equipment: 'machine' },
  { id: 'ex-057', name: 'Donkey Calf Raise',         primaryMuscle: 'calves',    subMuscles: [],                                equipment: 'bodyweight' },
  // ABS
  { id: 'ex-058', name: 'Crunch',                    primaryMuscle: 'abs',       subMuscles: [],                                equipment: 'bodyweight' },
  { id: 'ex-059', name: 'Plank',                     primaryMuscle: 'abs',       subMuscles: ['obliques'],                      equipment: 'bodyweight' },
  { id: 'ex-060', name: 'Cable Crunch',              primaryMuscle: 'abs',       subMuscles: [],                                equipment: 'cable' },
  { id: 'ex-061', name: 'Hanging Leg Raise',         primaryMuscle: 'abs',       subMuscles: ['hip_flexors'],                   equipment: 'bodyweight' },
  { id: 'ex-062', name: 'Russian Twist',             primaryMuscle: 'abs',       subMuscles: ['obliques'],                      equipment: 'bodyweight' },
  { id: 'ex-063', name: 'Ab Wheel Rollout',          primaryMuscle: 'abs',       subMuscles: ['lats'],                          equipment: 'bodyweight' },
  // TRAPS
  { id: 'ex-064', name: 'Barbell Shrug',             primaryMuscle: 'traps',     subMuscles: [],                                equipment: 'barbell' },
  { id: 'ex-065', name: 'Dumbbell Shrug',            primaryMuscle: 'traps',     subMuscles: [],                                equipment: 'dumbbell' },
  // COMPOUND / FULL BODY
  { id: 'ex-066', name: 'Power Clean',               primaryMuscle: 'back',      subMuscles: ['traps','quads','glutes'],         equipment: 'barbell' },
  { id: 'ex-067', name: 'Clean and Press',           primaryMuscle: 'shoulders', subMuscles: ['traps','quads','glutes'],         equipment: 'barbell' },
  { id: 'ex-068', name: 'Kettlebell Swing',          primaryMuscle: 'glutes',    subMuscles: ['hamstrings','lower_back'],        equipment: 'kettlebell' },
  { id: 'ex-069', name: 'Farmer Walk',               primaryMuscle: 'traps',     subMuscles: ['forearms','quads'],               equipment: 'dumbbell' },
  { id: 'ex-070', name: 'Dumbbell Romanian Deadlift',primaryMuscle: 'hamstrings',subMuscles: ['glutes','lower_back'],            equipment: 'dumbbell' },
];

export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'traps',
] as const;

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell',
] as const;
```

- [ ] **Step 1.2: Create seed function**

Create `src/db/seed.ts`:

```typescript
import { db } from './client';
import { exercises } from './schema';
import { EXERCISES } from '@/data/exercises';

export async function seedExercises() {
  const existing = await db.select().from(exercises).limit(1);
  if (existing.length > 0) return; // already seeded

  await db.insert(exercises).values(
    EXERCISES.map((e) => ({
      id: e.id,
      name: e.name,
      primaryMuscle: e.primaryMuscle,
      subMuscles: JSON.stringify(e.subMuscles),
      equipment: e.equipment,
      isCustom: false,
    }))
  );
}
```

- [ ] **Step 1.3: Call seedExercises in root layout**

In `app/_layout.tsx`, update the useEffect to call `seedExercises` after `initDatabase`:

```typescript
// add import at top
import { seedExercises } from '@/db/seed';

// inside useEffect, after initDatabase():
initDatabase().then(() => seedExercises());
```

The full updated useEffect block:
```typescript
useEffect(() => {
  initDatabase().then(() => seedExercises());

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    if (session) fetchProfile();
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    if (session) fetchProfile();
  });

  return () => subscription.unsubscribe();
}, []);
```

- [ ] **Step 1.4: Commit**

```bash
git add src/data/exercises.ts src/db/seed.ts app/_layout.tsx
git commit -m "feat: add exercise seed data and auto-seed on first launch"
```

---

## Task 2: Active workout Zustand store

**Files:**
- Create: `src/stores/workout.ts`

- [ ] **Step 2.1: Create workout store**

Create `src/stores/workout.ts`:

```typescript
import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import { db } from '@/db/client';
import { workoutSessions, workoutSets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';

export interface ActiveSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  isPr: boolean;
}

export interface ActiveExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string;
  sets: ActiveSet[];
}

export interface WorkoutSummary {
  sessionId: string;
  durationSeconds: number;
  totalVolumeKg: number;
  setCount: number;
  prCount: number;
  musclesWorked: string[];
}

interface WorkoutState {
  sessionId: string | null;
  startedAt: Date | null;
  exercises: ActiveExercise[];
  elapsedSeconds: number;
  isActive: boolean;

  startWorkout: () => void;
  addExercise: (exercise: { id: string; name: string; primaryMuscle: string }) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, field: 'weightKg' | 'reps', value: number) => void;
  markSetPr: (exerciseId: string, setId: string, isPr: boolean) => void;
  completeSet: (exerciseId: string, setId: string) => Promise<void>;
  uncompleteSet: (exerciseId: string, setId: string) => void;
  finishWorkout: (userId: string) => Promise<WorkoutSummary>;
  discardWorkout: () => void;
  tick: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  sessionId: null,
  startedAt: null,
  exercises: [],
  elapsedSeconds: 0,
  isActive: false,

  startWorkout: () => {
    set({
      sessionId: randomUUID(),
      startedAt: new Date(),
      exercises: [],
      elapsedSeconds: 0,
      isActive: true,
    });
  },

  addExercise: (exercise) => {
    const { exercises } = get();
    if (exercises.find((e) => e.exerciseId === exercise.id)) return; // already added
    set({
      exercises: [
        ...exercises,
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          primaryMuscle: exercise.primaryMuscle,
          sets: [
            { id: randomUUID(), setNumber: 1, weightKg: 0, reps: 0, completed: false, isPr: false },
          ],
        },
      ],
    });
  },

  removeExercise: (exerciseId) => {
    set({ exercises: get().exercises.filter((e) => e.exerciseId !== exerciseId) });
  },

  addSet: (exerciseId) => {
    set({
      exercises: get().exercises.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const lastSet = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              id: randomUUID(),
              setNumber: e.sets.length + 1,
              weightKg: lastSet?.weightKg ?? 0,
              reps: lastSet?.reps ?? 0,
              completed: false,
              isPr: false,
            },
          ],
        };
      }),
    });
  },

  updateSet: (exerciseId, setId, field, value) => {
    set({
      exercises: get().exercises.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s) =>
            s.id === setId ? { ...s, [field]: value } : s
          ),
        };
      }),
    });
  },

  markSetPr: (exerciseId, setId, isPr) => {
    set({
      exercises: get().exercises.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s) => (s.id === setId ? { ...s, isPr } : s)),
        };
      }),
    });
  },

  completeSet: async (exerciseId, setId) => {
    // Mark complete in store
    set({
      exercises: get().exercises.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s) =>
            s.id === setId ? { ...s, completed: true } : s
          ),
        };
      }),
    });

    // Check PR: find best previous 1RM estimate (weight * (1 + reps/30))
    const exercise = get().exercises.find((e) => e.exerciseId === exerciseId);
    const completedSet = exercise?.sets.find((s) => s.id === setId);
    if (!exercise || !completedSet) return;

    const previousSets = await db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.exerciseId, exerciseId));

    const currentEstimated = completedSet.weightKg * (1 + completedSet.reps / 30);
    const prevBest = previousSets.reduce((best, s) => {
      const est = s.weightKg * (1 + s.reps / 30);
      return est > best ? est : best;
    }, 0);

    if (currentEstimated > prevBest && completedSet.weightKg > 0 && completedSet.reps > 0) {
      get().markSetPr(exerciseId, setId, true);
    }
  },

  uncompleteSet: (exerciseId, setId) => {
    set({
      exercises: get().exercises.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s) =>
            s.id === setId ? { ...s, completed: false, isPr: false } : s
          ),
        };
      }),
    });
  },

  finishWorkout: async (userId: string) => {
    const { sessionId, startedAt, exercises, elapsedSeconds } = get();
    if (!sessionId || !startedAt) throw new Error('No active workout');

    const completedSets = exercises.flatMap((e) =>
      e.sets.filter((s) => s.completed).map((s) => ({ ...s, exerciseId: e.exerciseId }))
    );

    const totalVolumeKg = completedSets.reduce(
      (sum, s) => sum + s.weightKg * s.reps, 0
    );
    const prCount = completedSets.filter((s) => s.isPr).length;
    const musclesWorked = [...new Set(exercises.map((e) => e.primaryMuscle))];

    // Save session to SQLite
    await db.insert(workoutSessions).values({
      id: sessionId,
      userId,
      startedAt,
      endedAt: new Date(),
      durationSeconds: elapsedSeconds,
      totalVolumeKg,
      setCount: completedSets.length,
    });

    // Save sets to SQLite
    if (completedSets.length > 0) {
      await db.insert(workoutSets).values(
        completedSets.map((s) => ({
          id: s.id,
          sessionId,
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: s.reps,
          isPr: s.isPr,
          completedAt: new Date(),
        }))
      );
    }

    const summary: WorkoutSummary = {
      sessionId,
      durationSeconds: elapsedSeconds,
      totalVolumeKg,
      setCount: completedSets.length,
      prCount,
      musclesWorked,
    };

    set({ sessionId: null, startedAt: null, exercises: [], elapsedSeconds: 0, isActive: false });
    return summary;
  },

  discardWorkout: () => {
    set({ sessionId: null, startedAt: null, exercises: [], elapsedSeconds: 0, isActive: false });
  },

  tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
}));
```

- [ ] **Step 2.2: Commit**

```bash
git add src/stores/workout.ts
git commit -m "feat: add active workout Zustand store with set tracking and PR detection"
```

---

## Task 3: SetRow component

**Files:**
- Create: `src/components/workout/SetRow.tsx`

- [ ] **Step 3.1: Create SetRow component**

Create `src/components/workout/SetRow.tsx`:

```typescript
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import type { ActiveSet } from '@/stores/workout';

interface SetRowProps {
  set: ActiveSet;
  onWeightChange: (value: number) => void;
  onRepsChange: (value: number) => void;
  onComplete: () => void;
  onUncomplete: () => void;
}

export function SetRow({ set, onWeightChange, onRepsChange, onComplete, onUncomplete }: SetRowProps) {
  return (
    <View style={[styles.row, set.completed && styles.completedRow]}>
      {/* Set number */}
      <Text style={styles.setNum}>{set.setNumber}</Text>

      {/* PR badge */}
      {set.isPr && <Text style={styles.prBadge}>PR</Text>}

      {/* Weight input */}
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, set.completed && styles.inputCompleted]}
          value={set.weightKg > 0 ? String(set.weightKg) : ''}
          onChangeText={(v) => onWeightChange(parseFloat(v) || 0)}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          editable={!set.completed}
        />
        <Text style={styles.unit}>kg</Text>
      </View>

      {/* Reps input */}
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, set.completed && styles.inputCompleted]}
          value={set.reps > 0 ? String(set.reps) : ''}
          onChangeText={(v) => onRepsChange(parseInt(v) || 0)}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          editable={!set.completed}
        />
        <Text style={styles.unit}>reps</Text>
      </View>

      {/* Complete/undo button */}
      <TouchableOpacity
        style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
        onPress={set.completed ? onUncomplete : onComplete}
        activeOpacity={0.7}
      >
        <Text style={styles.checkIcon}>{set.completed ? '✓' : '○'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  completedRow: { opacity: 0.75 },
  setNum: {
    width: 24,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  prBadge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.heavy,
    color: Colors.primary,
    backgroundColor: Colors.bgHighlight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    width: 56,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    textAlign: 'center',
  },
  inputCompleted: { borderColor: Colors.success + '60' },
  unit: { fontSize: FontSize.xs, color: Colors.textMuted },
  checkBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: { borderColor: Colors.success, backgroundColor: Colors.success + '20' },
  checkIcon: { fontSize: FontSize.lg, color: Colors.textPrimary },
});
```

- [ ] **Step 3.2: Commit**

```bash
git add src/components/workout/SetRow.tsx
git commit -m "feat: add SetRow component (weight/reps inputs, PR badge, complete toggle)"
```

---

## Task 4: ExerciseBlock component

**Files:**
- Create: `src/components/workout/ExerciseBlock.tsx`

- [ ] **Step 4.1: Create ExerciseBlock**

Create `src/components/workout/ExerciseBlock.tsx`:

```typescript
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { SetRow } from './SetRow';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import type { ActiveExercise } from '@/stores/workout';

interface ExerciseBlockProps {
  exercise: ActiveExercise;
  onAddSet: () => void;
  onRemove: () => void;
  onWeightChange: (setId: string, value: number) => void;
  onRepsChange: (setId: string, value: number) => void;
  onCompleteSet: (setId: string) => void;
  onUncompleteSet: (setId: string) => void;
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444', back: '#3b82f6', shoulders: '#a855f7',
  biceps: '#f59e0b', triceps: '#f97316', quads: '#22c55e',
  hamstrings: '#06b6d4', glutes: '#ec4899', calves: '#84cc16',
  abs: '#f97316', traps: '#6366f1',
};

export function ExerciseBlock({
  exercise, onAddSet, onRemove,
  onWeightChange, onRepsChange, onCompleteSet, onUncompleteSet,
}: ExerciseBlockProps) {
  const muscleColor = MUSCLE_COLORS[exercise.primaryMuscle] ?? Colors.primary;
  const completedCount = exercise.sets.filter((s) => s.completed).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.muscleDot, { backgroundColor: muscleColor }]} />
        <View style={styles.titleBlock}>
          <Text variant="title">{exercise.exerciseName}</Text>
          <Text variant="caption" style={{ color: muscleColor }}>
            {exercise.primaryMuscle} · {completedCount}/{exercise.sets.length} sets
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Column headers */}
      <View style={styles.colHeaders}>
        <Text style={[styles.colLabel, { width: 24 }]}>#</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Weight</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Reps</Text>
        <Text style={[styles.colLabel, { width: 36 }]}></Text>
      </View>

      {/* Sets */}
      {exercise.sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          onWeightChange={(v) => onWeightChange(set.id, v)}
          onRepsChange={(v) => onRepsChange(set.id, v)}
          onComplete={() => onCompleteSet(set.id)}
          onUncomplete={() => onUncompleteSet(set.id)}
        />
      ))}

      {/* Add set */}
      <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  muscleDot: { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  titleBlock: { flex: 1 },
  removeBtn: { padding: 4 },
  removeIcon: { fontSize: FontSize.sm, color: Colors.textMuted },
  colHeaders: { flexDirection: 'row', marginBottom: 4, gap: Spacing.sm },
  colLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  addSetBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
  },
  addSetText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold },
});
```

- [ ] **Step 4.2: Commit**

```bash
git add src/components/workout/ExerciseBlock.tsx
git commit -m "feat: add ExerciseBlock component (sets list, add set, muscle color)"
```

---

## Task 5: ExerciseSearchModal

**Files:**
- Create: `src/components/workout/ExerciseSearchModal.tsx`

- [ ] **Step 5.1: Create ExerciseSearchModal**

Create `src/components/workout/ExerciseSearchModal.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  View, Modal, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { db } from '@/db/client';
import { exercises as exercisesTable } from '@/db/schema';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/data/exercises';

interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: { id: string; name: string; primaryMuscle: string }) => void;
}

export function ExerciseSearchModal({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);
  const [all, setAll] = useState<Exercise[]>([]);

  useEffect(() => {
    if (visible) {
      db.select().from(exercisesTable).then(setAll);
    }
  }, [visible]);

  const filtered = all.filter((e) => {
    const matchesQuery = query.length === 0 || e.name.toLowerCase().includes(query.toLowerCase());
    const matchesMuscle = !muscleFilter || e.primaryMuscle === muscleFilter;
    const matchesEquip = !equipmentFilter || e.equipment === equipmentFilter;
    return matchesQuery && matchesMuscle && matchesEquip;
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="title">Add Exercise</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          clearButtonMode="while-editing"
        />

        {/* Muscle filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
          {MUSCLE_GROUPS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, muscleFilter === m && styles.chipActive]}
              onPress={() => setMuscleFilter(muscleFilter === m ? null : m)}
            >
              <Text style={[styles.chipText, muscleFilter === m && styles.chipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Equipment filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
          {EQUIPMENT_TYPES.map((eq) => (
            <TouchableOpacity
              key={eq}
              style={[styles.chip, equipmentFilter === eq && styles.chipActive]}
              onPress={() => setEquipmentFilter(equipmentFilter === eq ? null : eq)}
            >
              <Text style={[styles.chipText, equipmentFilter === eq && styles.chipTextActive]}>{eq}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultRow}
              onPress={() => { onSelect(item); onClose(); }}
              activeOpacity={0.7}
            >
              <View style={styles.resultText}>
                <Text variant="body">{item.name}</Text>
                <Text variant="caption">{item.primaryMuscle} · {item.equipment}</Text>
              </View>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text variant="caption" style={styles.empty}>No exercises found</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, paddingBottom: Spacing.md,
  },
  closeBtn: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
  searchInput: {
    margin: Spacing.xl, marginTop: 0,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  chipsScroll: { maxHeight: 40, marginBottom: Spacing.sm },
  chips: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.bgCard,
  },
  chipActive: { backgroundColor: Colors.bgHighlight, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  chipTextActive: { color: Colors.primary },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  resultText: { flex: 1 },
  addIcon: { fontSize: 22, color: Colors.primary, fontWeight: FontWeight.heavy },
  separator: { height: 1, backgroundColor: Colors.bgCardBorder, marginLeft: Spacing.xl },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl },
});
```

- [ ] **Step 5.2: Commit**

```bash
git add src/components/workout/ExerciseSearchModal.tsx
git commit -m "feat: add ExerciseSearchModal with search + muscle/equipment filters"
```

---

## Task 6: Active workout screen

**Files:**
- Create: `app/active-workout.tsx`

- [ ] **Step 6.1: Create active workout screen**

Create `app/active-workout.tsx`:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useWorkoutStore } from '@/stores/workout';
import { useAuthStore } from '@/stores/auth';
import { ExerciseBlock } from '@/components/workout/ExerciseBlock';
import { ExerciseSearchModal } from '@/components/workout/ExerciseSearchModal';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize, FontWeight } from '@/lib/constants';
import { formatDuration } from '@/lib/utils';
import { calculateWorkoutXp } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

export default function ActiveWorkoutScreen() {
  const {
    isActive, startWorkout, exercises, elapsedSeconds,
    addExercise, removeExercise, addSet,
    updateSet, completeSet, uncompleteSet,
    finishWorkout, discardWorkout, tick,
  } = useWorkoutStore();
  const { user, profile, setProfile } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start workout on mount if not already active
  useEffect(() => {
    if (!isActive) startWorkout();
  }, []);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => tick(), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const totalVolume = exercises
    .flatMap((e) => e.sets.filter((s) => s.completed))
    .reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  const completedSetCount = exercises.flatMap((e) => e.sets.filter((s) => s.completed)).length;

  async function handleFinish() {
    if (completedSetCount === 0) {
      Alert.alert('No sets logged', 'Complete at least one set before finishing.');
      return;
    }
    Alert.alert('Finish Workout?', 'This will save your session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          setFinishing(true);
          try {
            const summary = await finishWorkout(user!.id);
            const xp = calculateWorkoutXp(summary.totalVolumeKg, summary.prCount);
            router.replace({
              pathname: '/workout-summary',
              params: {
                sessionId: summary.sessionId,
                durationSeconds: String(summary.durationSeconds),
                totalVolumeKg: String(summary.totalVolumeKg),
                setCount: String(summary.setCount),
                prCount: String(summary.prCount),
                musclesWorked: summary.musclesWorked.join(','),
                xpEarned: String(xp),
              },
            });
          } catch (e) {
            Alert.alert('Error', 'Failed to save workout.');
          } finally {
            setFinishing(false);
          }
        },
      },
    ]);
  }

  function handleDiscard() {
    Alert.alert('Discard Workout?', 'All progress will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { discardWorkout(); router.back(); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Text style={styles.discardBtn}>✕</Text>
        </TouchableOpacity>
        <View style={styles.timerBlock}>
          <Text style={styles.timer}>{formatDuration(elapsedSeconds)}</Text>
          <Text variant="caption">{Math.round(totalVolume)} kg total</Text>
        </View>
        <Button
          label="Finish"
          onPress={handleFinish}
          loading={finishing}
          variant="primary"
          style={styles.finishBtn}
        />
      </View>

      {/* Exercise list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {exercises.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💪</Text>
            <Text variant="title" style={styles.emptyTitle}>No exercises yet</Text>
            <Text variant="caption">Tap the button below to add your first exercise</Text>
          </View>
        )}

        {exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.exerciseId}
            exercise={exercise}
            onAddSet={() => { addSet(exercise.exerciseId); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            onRemove={() => removeExercise(exercise.exerciseId)}
            onWeightChange={(setId, v) => updateSet(exercise.exerciseId, setId, 'weightKg', v)}
            onRepsChange={(setId, v) => updateSet(exercise.exerciseId, setId, 'reps', v)}
            onCompleteSet={(setId) => { completeSet(exercise.exerciseId, setId); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            onUncompleteSet={(setId) => uncompleteSet(exercise.exerciseId, setId)}
          />
        ))}

        {/* Add Exercise button */}
        <Button
          label="+ Add Exercise"
          onPress={() => setShowSearch(true)}
          variant="secondary"
          style={styles.addExBtn}
        />
      </ScrollView>

      <ExerciseSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={(ex) => { addExercise(ex); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgCardBorder,
  },
  discardBtn: { fontSize: 20, color: Colors.textSecondary, padding: 4 },
  timerBlock: { alignItems: 'center' },
  timer: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  finishBtn: { paddingVertical: 10, paddingHorizontal: Spacing.lg },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 80 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { marginTop: Spacing.md },
  addExBtn: { marginTop: Spacing.md },
});
```

- [ ] **Step 6.2: Commit**

```bash
git add app/active-workout.tsx
git commit -m "feat: add active workout screen with timer, exercise blocks, finish/discard"
```

---

## Task 7: Workout summary screen

**Files:**
- Create: `app/workout-summary.tsx`

- [ ] **Step 7.1: Create workout summary screen**

Create `app/workout-summary.tsx`:

```typescript
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { formatDuration, formatVolume, getLevelTitle } from '@/lib/utils';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444', back: '#3b82f6', shoulders: '#a855f7',
  biceps: '#f59e0b', triceps: '#f97316', quads: '#22c55e',
  hamstrings: '#06b6d4', glutes: '#ec4899', calves: '#84cc16',
  abs: '#f97316', traps: '#6366f1',
};

export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams<{
    durationSeconds: string;
    totalVolumeKg: string;
    setCount: string;
    prCount: string;
    musclesWorked: string;
    xpEarned: string;
  }>();

  const duration = parseInt(params.durationSeconds ?? '0');
  const volume = parseFloat(params.totalVolumeKg ?? '0');
  const sets = parseInt(params.setCount ?? '0');
  const prs = parseInt(params.prCount ?? '0');
  const muscles = params.musclesWorked ? params.musclesWorked.split(',').filter(Boolean) : [];
  const xp = parseInt(params.xpEarned ?? '0');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <Text style={styles.heroIcon}>{prs > 0 ? '🏆' : '💪'}</Text>
        <Text variant="heading" style={styles.heroTitle}>
          {prs > 0 ? 'New Personal Records!' : 'Workout Complete!'}
        </Text>

        {/* XP earned */}
        <Card accent style={styles.xpCard}>
          <Text variant="label" color={Colors.primary}>⚡ XP EARNED</Text>
          <Text style={styles.xpValue}>+{xp} XP</Text>
        </Card>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Duration', value: formatDuration(duration) },
            { label: 'Volume', value: `${formatVolume(volume)} kg` },
            { label: 'Sets', value: String(sets) },
            { label: 'PRs', value: String(prs) },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text variant="heading" color={Colors.primary}>{s.value}</Text>
              <Text variant="label">{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Muscles worked */}
        {muscles.length > 0 && (
          <Card style={styles.musclesCard}>
            <Text variant="label" style={{ marginBottom: Spacing.md }}>Muscles Worked</Text>
            <View style={styles.muscleChips}>
              {muscles.map((m) => (
                <View key={m} style={[styles.muscleChip, { backgroundColor: (MUSCLE_COLORS[m] ?? Colors.primary) + '25', borderColor: MUSCLE_COLORS[m] ?? Colors.primary }]}>
                  <Text style={[styles.muscleChipText, { color: MUSCLE_COLORS[m] ?? Colors.primary }]}>
                    {m}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* PR callout */}
        {prs > 0 && (
          <Card accent style={styles.prCard}>
            <Text variant="label" color={Colors.primary}>🏆 PERSONAL RECORDS</Text>
            <Text variant="body" style={{ marginTop: Spacing.sm }}>
              You set {prs} new PR{prs > 1 ? 's' : ''} today. Keep pushing!
            </Text>
          </Card>
        )}

        <Button label="Back to Home" onPress={() => router.replace('/(tabs)')} style={styles.homeBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, alignItems: 'center' },
  heroIcon: { fontSize: 72, marginTop: Spacing.xl },
  heroTitle: { textAlign: 'center' },
  xpCard: { width: '100%', alignItems: 'center', gap: Spacing.sm },
  xpValue: { fontSize: FontSize.display, fontWeight: FontWeight.heavy, color: Colors.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, width: '100%' },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', gap: 4 },
  musclesCard: { width: '100%' },
  muscleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  muscleChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  muscleChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  prCard: { width: '100%' },
  homeBtn: { width: '100%', marginTop: Spacing.md },
});
```

- [ ] **Step 7.2: Commit**

```bash
git add app/workout-summary.tsx
git commit -m "feat: add workout summary screen (XP, volume, PRs, muscles worked)"
```

---

## Task 8: Workout history screen

**Files:**
- Modify: `app/(tabs)/workout.tsx`

- [ ] **Step 8.1: Replace workout shell with history list**

Replace the contents of `app/(tabs)/workout.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { workoutSessions } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { useAuthStore } from '@/stores/auth';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight } from '@/lib/constants';
import { formatDuration, formatVolume } from '@/lib/utils';

interface SessionRow {
  id: string;
  startedAt: Date;
  durationSeconds: number | null;
  totalVolumeKg: number | null;
  setCount: number | null;
  name: string | null;
}

export default function WorkoutScreen() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    if (!user) return;
    db.select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, user.id))
      .orderBy(desc(workoutSessions.startedAt))
      .then(setSessions as any);
  }, [user]);

  function formatSessionDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="heading">Workout History</Text>
        <Button label="▶ Start" onPress={() => router.push('/active-workout')} variant="primary" style={styles.startBtn} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.sessionCard}>
            <View style={styles.cardRow}>
              <View>
                <Text variant="title">{item.name ?? formatSessionDate(item.startedAt)}</Text>
                <Text variant="caption">{formatSessionDate(item.startedAt)}</Text>
              </View>
              <Text style={styles.volumeText}>{formatVolume(item.totalVolumeKg ?? 0)} kg</Text>
            </View>
            <View style={styles.cardStats}>
              <Text variant="caption">⏱ {formatDuration(item.durationSeconds ?? 0)}</Text>
              <Text variant="caption">·</Text>
              <Text variant="caption">{item.setCount ?? 0} sets</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>💪</Text>
            <Text variant="title" style={{ marginTop: Spacing.md }}>No workouts yet</Text>
            <Text variant="caption">Start your first session!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, paddingBottom: Spacing.md,
  },
  startBtn: { paddingVertical: 8, paddingHorizontal: Spacing.md },
  list: { padding: Spacing.xl, paddingTop: 0, gap: Spacing.md },
  sessionCard: { gap: Spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  volumeText: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.primary },
  cardStats: { flexDirection: 'row', gap: Spacing.sm },
  empty: { alignItems: 'center', paddingTop: 80 },
});
```

- [ ] **Step 8.2: Commit**

```bash
git add app/\(tabs\)/workout.tsx
git commit -m "feat: workout history screen with past sessions list"
```

---

## Task 9: Sync completed workout to Supabase

**Files:**
- Create: `src/lib/workout-sync.ts`
- Modify: `app/workout-summary.tsx` (call sync in useEffect)

- [ ] **Step 9.1: Create sync function**

Create `src/lib/workout-sync.ts`:

```typescript
import { db } from '@/db/client';
import { workoutSessions, workoutSets } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq, isNull } from 'drizzle-orm';

export async function syncWorkoutSession(sessionId: string) {
  // Load session from local DB
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));
  if (!session || session.syncedAt) return; // not found or already synced

  // Load sets for this session
  const sets = await db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.sessionId, sessionId));

  // Upsert session to Supabase
  const { error: sessionError } = await supabase.from('workout_sessions').upsert({
    id: session.id,
    user_id: session.userId,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    duration_seconds: session.durationSeconds,
    total_volume_kg: session.totalVolumeKg,
    set_count: session.setCount,
    notes: session.notes,
  });
  if (sessionError) throw sessionError;

  // Upsert sets to Supabase
  if (sets.length > 0) {
    const { error: setsError } = await supabase.from('workout_sets').upsert(
      sets.map((s) => ({
        id: s.id,
        session_id: s.sessionId,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        weight_kg: s.weightKg,
        reps: s.reps,
        is_pr: s.isPr,
        completed_at: s.completedAt,
      }))
    );
    if (setsError) throw setsError;
  }

  // Mark as synced in local DB
  await db
    .update(workoutSessions)
    .set({ syncedAt: new Date() })
    .where(eq(workoutSessions.id, sessionId));
}
```

- [ ] **Step 9.2: Call sync from summary screen**

In `app/workout-summary.tsx`, add a `useEffect` that fires sync after render. Add the import and effect:

```typescript
// Add import at top of workout-summary.tsx
import { useEffect } from 'react';
import { syncWorkoutSession } from '@/lib/workout-sync';

// Add inside WorkoutSummaryScreen component, after the params destructuring:
useEffect(() => {
  if (params.sessionId) {
    syncWorkoutSession(params.sessionId).catch(console.warn);
  }
}, []);
```

The full updated component top (showing where to add):
```typescript
export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams<{ ... }>();

  // Sync to Supabase in background
  useEffect(() => {
    if (params.sessionId) {
      syncWorkoutSession(params.sessionId).catch(console.warn);
    }
  }, []);

  // ... rest of component unchanged
```

- [ ] **Step 9.3: Commit**

```bash
git add src/lib/workout-sync.ts app/workout-summary.tsx
git commit -m "feat: sync completed workout sessions to Supabase"
```

---

## Task 10: Register new screens in root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 10.1: Add active-workout and workout-summary to Stack**

In `app/_layout.tsx`, the Stack already uses `headerShown: false` globally. The new screens (`active-workout`, `workout-summary`) are picked up automatically by Expo Router from the `app/` directory. No change needed to `_layout.tsx` unless you want modal presentation.

For a better UX, present `active-workout` as a full-screen modal. Update the Stack in `_layout.tsx`:

```typescript
<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
  <Stack.Screen name="(auth)" />
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="active-workout" options={{ presentation: 'fullScreenModal' }} />
  <Stack.Screen name="workout-summary" options={{ presentation: 'fullScreenModal' }} />
</Stack>
```

- [ ] **Step 10.2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: present active-workout and workout-summary as full-screen modals"
```

---

## Task 11: Update Home screen Start Workout button

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 11.1: Update the stat cards to show real data**

The Home screen currently shows hardcoded zeros. Update it to query real data from SQLite. Replace `app/(tabs)/index.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StreakPill } from '@/components/ui/StreakPill';
import { LevelPill } from '@/components/ui/LevelPill';
import { Colors, Spacing } from '@/lib/constants';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { workoutSessions } from '@/db/schema';
import { eq, gte } from 'drizzle-orm';
import { formatVolume } from '@/lib/utils';

export default function HomeScreen() {
  const { profile, user } = useAuthStore();
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    db.select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, user.id))
      .then((rows) => {
        const thisWeek = rows.filter((r) => new Date(r.startedAt) >= weekAgo);
        setWeeklyWorkouts(thisWeek.length);
        setWeeklyVolume(thisWeek.reduce((sum, r) => sum + (r.totalVolumeKg ?? 0), 0));
      });
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text variant="caption">Good morning,</Text>
            <Text variant="heading">{profile?.username ?? 'Athlete'} 👋</Text>
          </View>
          <Text style={{ fontSize: 32 }}>🔥</Text>
        </View>

        <View style={styles.pills}>
          <StreakPill days={0} />
          <LevelPill level={profile?.level ?? 1} />
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'This Week', value: `${formatVolume(weeklyVolume)} kg` },
            { label: 'Workouts', value: String(weeklyWorkouts) },
            { label: 'Avg Protein', value: '0g' },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text variant="heading" color={Colors.primary}>{s.value}</Text>
              <Text variant="label">{s.label}</Text>
            </Card>
          ))}
        </View>

        <Card accent style={styles.aiCard}>
          <Text variant="label" color={Colors.primary}>⚡ AI TRAINER</Text>
          <Text variant="body" style={{ marginTop: Spacing.sm }}>
            {weeklyWorkouts === 0
              ? 'Complete your first workout so your AI trainer can learn your patterns!'
              : `${weeklyWorkouts} workout${weeklyWorkouts > 1 ? 's' : ''} this week. Keep it up!`}
          </Text>
        </Card>

        <Button
          label="▶ START WORKOUT"
          onPress={() => router.push('/active-workout')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pills: { flexDirection: 'row', gap: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  aiCard: { gap: Spacing.xs },
});
```

- [ ] **Step 11.2: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat: home screen shows real weekly volume and workout count from SQLite"
```

---

## Verification

- [ ] **Start workout** → timer runs, "+ Add Exercise" opens search modal
- [ ] **Search modal** → type "bench" filters to bench press exercises; muscle/equipment chips filter correctly
- [ ] **Add Bench Press** → ExerciseBlock appears with 1 empty set
- [ ] **Enter weight + reps, tap ✓** → set turns green; if best ever, shows "PR" badge
- [ ] **Add more sets** → "+ Add Set" pre-fills last set's values
- [ ] **Finish workout** → summary screen shows XP, volume, PRs, muscle chips
- [ ] **Workout tab** → shows the completed session with date, volume, duration
- [ ] **Home tab** → weekly volume and workout count update
- [ ] **Supabase** → `workout_sessions` and `workout_sets` tables have the new rows
