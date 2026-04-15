import { db } from '@/db/client';
import { workoutSets, workoutSessions } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface OverloadSuggestion {
  suggestedWeightKg: number;
  suggestedReps: number;
  lastWeightKg: number | null;
  lastReps: number | null;
  lastDate: string | null; // 'X days ago'
  trend: 'increase' | 'maintain' | 'baseline' | 'deload';
  message: string;
}

export async function getSuggestion(exerciseId: string, userId: string): Promise<OverloadSuggestion | null> {
  try {
    const rows = await db
      .select({
        sessionId: workoutSets.sessionId,
        weightKg: workoutSets.weightKg,
        reps: workoutSets.reps,
        rpe: workoutSets.rpe,
        startedAt: workoutSessions.startedAt,
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
      .where(and(eq(workoutSets.exerciseId, exerciseId), eq(workoutSessions.userId, userId)))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(30);

    if (rows.length === 0) return null;

    // Group by session, get max weight per session
    const sessionMap = new Map<string, { weightKg: number; reps: number; rpe: number | null; startedAt: Date }>();
    for (const row of rows) {
      const key = row.sessionId;
      const existing = sessionMap.get(key);
      if (!existing || row.weightKg > existing.weightKg) {
        sessionMap.set(key, {
          weightKg: row.weightKg,
          reps: row.reps,
          rpe: row.rpe,
          startedAt: row.startedAt as Date,
        });
      }
    }

    const sessions = Array.from(sessionMap.values()).slice(0, 3);
    if (sessions.length === 0) return null;

    const last = sessions[0];
    const prev = sessions[1];

    function daysAgoText(date: Date): string {
      const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (days === 0) return 'today';
      if (days === 1) return 'yesterday';
      return `${days} days ago`;
    }

    if (sessions.length === 1) {
      return {
        suggestedWeightKg: last.weightKg,
        suggestedReps: last.reps,
        lastWeightKg: last.weightKg,
        lastReps: last.reps,
        lastDate: daysAgoText(last.startedAt),
        trend: 'baseline',
        message: 'Match your last session',
      };
    }

    const sameWeight = prev != null && Math.abs(last.weightKg - prev.weightKg) < 0.5;
    const increased = prev != null && last.weightKg > prev.weightKg;

    if (sameWeight) {
      const lastRpe = last.rpe;
      const increment = (lastRpe != null && lastRpe <= 7) ? 5 : 2.5;
      const suggested = Math.round((last.weightKg + increment) * 2) / 2; // round to nearest 0.5
      return {
        suggestedWeightKg: suggested,
        suggestedReps: last.reps,
        lastWeightKg: last.weightKg,
        lastReps: last.reps,
        lastDate: daysAgoText(last.startedAt),
        trend: 'increase',
        message: `Try ${suggested} kg \u00d7 ${last.reps}`,
      };
    }

    if (increased) {
      return {
        suggestedWeightKg: last.weightKg,
        suggestedReps: last.reps,
        lastWeightKg: last.weightKg,
        lastReps: last.reps,
        lastDate: daysAgoText(last.startedAt),
        trend: 'maintain',
        message: 'Keep building',
      };
    }

    // Weight decreased or other case
    return {
      suggestedWeightKg: last.weightKg,
      suggestedReps: last.reps,
      lastWeightKg: last.weightKg,
      lastReps: last.reps,
      lastDate: daysAgoText(last.startedAt),
      trend: 'maintain',
      message: 'Match your last session',
    };
  } catch {
    return null;
  }
}

/**
 * Adjust a progressive overload suggestion based on today's readiness score.
 * Factor: 0.85 at readiness 0, 1.0 at readiness 100.
 */
export function applyReadinessAdjustment(
  suggestion: OverloadSuggestion,
  readinessScore: number | null,
): OverloadSuggestion {
  if (readinessScore === null) return suggestion;

  const factor = 0.85 + 0.15 * (readinessScore / 100);
  const adjustedWeight = Math.round((suggestion.suggestedWeightKg * factor) / 2.5) * 2.5;

  return {
    ...suggestion,
    suggestedWeightKg: adjustedWeight,
    message: `Try ${adjustedWeight} kg \u00d7 ${suggestion.suggestedReps} (readiness ${readinessScore})`,
  };
}
