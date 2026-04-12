import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import { db } from '@/db/client';
import { workoutSessions, workoutSets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { WarmupSet } from '@/lib/warmup-calculator';

export interface ActiveSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  isPr: boolean;
  rpe?: number | null;
  isWarmup?: boolean;
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
  updateSetRpe: (setId: string, rpe: number | null) => Promise<void>;
  addWarmupSets: (exerciseId: string, warmupWeights: WarmupSet[]) => void;
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
    if (exercises.find((e) => e.exerciseId === exercise.id)) return;
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

    // Check PR using estimated 1RM: weight * (1 + reps/30)
    const exercise = get().exercises.find((e) => e.exerciseId === exerciseId);
    const completedSet = exercise?.sets.find((s) => s.id === setId);
    if (!exercise || !completedSet || completedSet.weightKg === 0) return;

    const previousSets = await db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.exerciseId, exerciseId));

    const currentEstimated = completedSet.weightKg * (1 + completedSet.reps / 30);
    const prevBest = previousSets.reduce((best, s) => {
      const est = s.weightKg * (1 + s.reps / 30);
      return est > best ? est : best;
    }, 0);

    if (currentEstimated > prevBest && completedSet.reps > 0) {
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

  updateSetRpe: async (setId, rpe) => {
    set((s) => ({
      exercises: s.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => (s.id === setId ? { ...s, rpe } : s)),
      })),
    }));
    await db.update(workoutSets).set({ rpe }).where(eq(workoutSets.id, setId));
  },

  addWarmupSets: (exerciseId, warmupWeights) => {
    set((s) => ({
      exercises: s.exercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        const newWarmupSets = warmupWeights.map((w, i) => ({
          id: randomUUID(),
          setNumber: -(warmupWeights.length - i), // -3, -2, -1 for 3 warmups
          weightKg: w.weightKg,
          reps: w.reps,
          completed: false,
          isPr: false,
          isWarmup: true,
        }));
        // Renumber existing sets starting from 1
        const existingSets = ex.sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
        return { ...ex, sets: [...newWarmupSets, ...existingSets] };
      }),
    }));
  },

  finishWorkout: async (userId: string) => {
    const { sessionId, startedAt, exercises, elapsedSeconds } = get();
    if (!sessionId || !startedAt) throw new Error('No active workout');

    const completedSets = exercises.flatMap((e) =>
      e.sets.filter((s) => s.completed && !s.isWarmup).map((s) => ({ ...s, exerciseId: e.exerciseId }))
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
          rpe: s.rpe ?? null,
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
