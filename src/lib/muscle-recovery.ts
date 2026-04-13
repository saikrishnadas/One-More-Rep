import { db } from '@/db/client';
import { workoutSets, workoutSessions, exercises } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export type RecoveryStatus = 'fresh' | 'recovering' | 'fatigued';

export interface MuscleRecovery {
  status: RecoveryStatus;
  recoveryPct: number;      // 0–100, 100 = fully recovered
  trainedHoursAgo: number;  // Hours since last set completion
  readyInHours: number;     // Hours until fully recovered (0 if already recovered)
}

// Standard muscles always returned
const STANDARD_MUSCLES = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'traps',
];

function getRecoveryWindow(goal?: string | null): number {
  switch (goal) {
    case 'strength':    return 72;
    case 'hypertrophy': return 48;
    case 'endurance':   return 24;
    default:            return 48;
  }
}

export async function getMuscleRecovery(
  userId: string,
  goal?: string | null,
): Promise<Record<string, MuscleRecovery>> {
  try {
    const recoveryWindowHours = getRecoveryWindow(goal);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all sessions in last 7 days for this user
    const recentSessions = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.startedAt, sevenDaysAgo),
        ),
      );

    // muscle -> most recent completedAt (ms)
    const lastCompletedMs: Record<string, number> = {};

    for (const session of recentSessions) {
      const sets = await db
        .select({
          exerciseId: workoutSets.exerciseId,
          completedAt: workoutSets.completedAt,
        })
        .from(workoutSets)
        .where(eq(workoutSets.sessionId, session.id));

      const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];

      for (const exId of exerciseIds) {
        const exRows = await db
          .select({ primaryMuscle: exercises.primaryMuscle })
          .from(exercises)
          .where(eq(exercises.id, exId))
          .limit(1);

        if (!exRows[0]) continue;

        const muscle = exRows[0].primaryMuscle.toLowerCase();

        // Find most recent completedAt for this exercise in this session
        const exerciseSets = sets.filter((s) => s.exerciseId === exId);
        for (const s of exerciseSets) {
          if (!s.completedAt) continue;
          const ts = s.completedAt instanceof Date
            ? s.completedAt.getTime()
            : Number(s.completedAt);
          if (!lastCompletedMs[muscle] || ts > lastCompletedMs[muscle]) {
            lastCompletedMs[muscle] = ts;
          }
        }
      }
    }

    const now = Date.now();
    const result: Record<string, MuscleRecovery> = {};

    // Build result for all standard muscles
    for (const muscle of STANDARD_MUSCLES) {
      const lastMs = lastCompletedMs[muscle];

      if (!lastMs) {
        // Never trained in 7 days → fresh
        result[muscle] = {
          status: 'fresh',
          recoveryPct: 100,
          trainedHoursAgo: 0,
          readyInHours: 0,
        };
        continue;
      }

      const trainedHoursAgo = (now - lastMs) / (1000 * 60 * 60);
      const recoveryPct = Math.min(
        100,
        Math.round((trainedHoursAgo / recoveryWindowHours) * 100),
      );
      const readyInHours = Math.max(
        0,
        Math.ceil(recoveryWindowHours - trainedHoursAgo),
      );

      let status: RecoveryStatus;
      if (recoveryPct >= 100) status = 'fresh';
      else if (recoveryPct >= 50) status = 'recovering';
      else status = 'fatigued';

      result[muscle] = {
        status,
        recoveryPct,
        trainedHoursAgo: Math.round(trainedHoursAgo),
        readyInHours,
      };
    }

    // Also include any muscles trained that aren't in STANDARD_MUSCLES
    for (const muscle of Object.keys(lastCompletedMs)) {
      if (result[muscle]) continue;

      const lastMs = lastCompletedMs[muscle];
      const trainedHoursAgo = (now - lastMs) / (1000 * 60 * 60);
      const recoveryPct = Math.min(
        100,
        Math.round((trainedHoursAgo / recoveryWindowHours) * 100),
      );
      const readyInHours = Math.max(
        0,
        Math.ceil(recoveryWindowHours - trainedHoursAgo),
      );

      let status: RecoveryStatus;
      if (recoveryPct >= 100) status = 'fresh';
      else if (recoveryPct >= 50) status = 'recovering';
      else status = 'fatigued';

      result[muscle] = { status, recoveryPct, trainedHoursAgo: Math.round(trainedHoursAgo), readyInHours };
    }

    return result;
  } catch {
    // On error, return all standard muscles as fresh
    const fallback: Record<string, MuscleRecovery> = {};
    for (const muscle of STANDARD_MUSCLES) {
      fallback[muscle] = { status: 'fresh', recoveryPct: 100, trainedHoursAgo: 0, readyInHours: 0 };
    }
    return fallback;
  }
}
