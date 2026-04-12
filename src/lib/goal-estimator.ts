import { db } from '@/db/client';
import { bodyMeasurements, workoutSessions, habitLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';

export interface GoalEstimate {
  goal: string;
  currentValue: number | null;
  targetValue: number | null;
  weeklyRate: number | null;
  estimatedDate: string | null;
  weeksRemaining: number | null;
  confidenceNote: string;
  adherenceScore: number;
  onTrack: boolean;
}

export async function estimateGoal(userId: string, goal: string | null, targetWeightKg: number | null): Promise<GoalEstimate> {
  const measurements = await db.select().from(bodyMeasurements)
    .where(eq(bodyMeasurements.userId, userId));
  const weightPoints = measurements
    .filter(m => m.weightKg != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  let currentValue: number | null = null;
  let weeklyRate: number | null = null;
  let estimatedDate: string | null = null;
  let weeksRemaining: number | null = null;
  let confidenceNote = 'Log your weight in Body Measurements to see this estimate';

  if (weightPoints.length >= 2) {
    const first = weightPoints[0];
    const last = weightPoints[weightPoints.length - 1];
    currentValue = last.weightKg;
    const daysDiff = (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000;
    const kgDiff = last.weightKg! - first.weightKg!;
    weeklyRate = daysDiff > 0 ? (kgDiff / daysDiff) * 7 : null;
    confidenceNote = `Based on ${weightPoints.length} weigh-ins over ${Math.round(daysDiff)} days`;

    if (targetWeightKg != null && weeklyRate != null && weeklyRate !== 0) {
      const kgToGo = targetWeightKg - currentValue!;
      const weeksNeeded = kgToGo / weeklyRate;
      if (weeksNeeded > 0 && weeksNeeded < 200) {
        weeksRemaining = Math.round(weeksNeeded);
        const estDate = new Date();
        estDate.setDate(estDate.getDate() + weeksRemaining * 7);
        estimatedDate = formatDate(estDate);
      }
    }
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyAgoStr = formatDate(thirtyDaysAgo);

  const sessions = await db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId));
  // startedAt is a Date object (timestamp_ms mode)
  const recentSessions = sessions.filter(s => {
    const sessionDate = s.startedAt instanceof Date ? s.startedAt : new Date(s.startedAt);
    return formatDate(sessionDate) >= thirtyAgoStr;
  });
  const workoutScore = Math.min(100, Math.round(recentSessions.length / 16 * 100));

  const habitLogsRows = await db.select().from(habitLogs)
    .where(eq(habitLogs.userId, userId));
  const recentHabits = habitLogsRows.filter(l => l.date >= thirtyAgoStr);
  const habitScore = recentHabits.length > 0
    ? Math.round(recentHabits.filter(l => l.completed).length / recentHabits.length * 100)
    : 50;

  const adherenceScore = Math.round((workoutScore + habitScore) / 2);
  const onTrack = adherenceScore >= 70;

  return {
    goal: goal ?? 'general fitness',
    currentValue,
    targetValue: targetWeightKg,
    weeklyRate,
    estimatedDate,
    weeksRemaining,
    confidenceNote,
    adherenceScore,
    onTrack,
  };
}
