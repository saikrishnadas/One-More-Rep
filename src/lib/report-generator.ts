import { db } from '@/db/client';
import { workoutSessions, workoutSets, nutritionLogs, habitLogs, bodyMeasurements, exercises } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

export interface PeriodReport {
  periodStart: string;
  periodEnd: string;
  workoutsCompleted: number;
  totalVolumeKg: number;
  avgSessionDurationMin: number;
  topMuscles: string[];
  newPRs: { exercise: string; weightKg: number; reps: number }[];
  avgCalories: number;
  avgProteinG: number;
  habitCompletionPct: number;
  weightChange: number | null;
  aiNarrative: string;
  volumeTrend: { label: string; volume: number }[];
}

export async function generateReport(userId: string): Promise<PeriodReport> {
  const now = new Date();
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(now.getDate() - 10);
  const start = formatDate(tenDaysAgo);
  const end = formatDate(now);

  const sessions = await db.select().from(workoutSessions)
    .where(eq(workoutSessions.userId, userId));
  const periodSessions = sessions.filter(s => {
    const d = formatDate(new Date(s.startedAt));
    return d >= start && d <= end;
  });

  const workoutsCompleted = periodSessions.length;
  const totalVolumeKg = periodSessions.reduce((s, r) => s + (r.totalVolumeKg ?? 0), 0);
  const avgSessionDurationMin = workoutsCompleted > 0
    ? Math.round(periodSessions.reduce((s, r) => s + (r.durationSeconds ?? 0), 0) / workoutsCompleted / 60)
    : 0;

  const sessionIds = new Set(periodSessions.map(s => s.id));
  const allSets = await db.select().from(workoutSets);
  const periodSets = allSets.filter(s => sessionIds.has(s.sessionId));

  const allExercises = await db.select().from(exercises);
  const exMap = Object.fromEntries(allExercises.map(e => [e.id, e.name]));
  const newPRs = periodSets
    .filter(s => s.isPr)
    .map(s => ({ exercise: exMap[s.exerciseId] ?? s.exerciseId, weightKg: s.weightKg, reps: s.reps }))
    .slice(0, 5);

  const muscleCounts: Record<string, number> = {};
  periodSets.forEach(s => {
    const ex = allExercises.find(e => e.id === s.exerciseId);
    if (ex) muscleCounts[ex.primaryMuscle] = (muscleCounts[ex.primaryMuscle] ?? 0) + 1;
  });
  const topMuscles = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1]).map(([m]) => m).slice(0, 3);

  const nutritionRows = await db.select().from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, userId), gte(nutritionLogs.date, start)));
  const daysWithFood = new Set(nutritionRows.map(r => r.date)).size || 1;
  const avgCalories = Math.round(nutritionRows.reduce((s, r) => s + r.calories, 0) / daysWithFood);
  const avgProteinG = Math.round(nutritionRows.reduce((s, r) => s + (r.proteinG ?? 0), 0) / daysWithFood);

  const habitLogRows = await db.select().from(habitLogs)
    .where(and(eq(habitLogs.userId, userId), gte(habitLogs.date, start)));
  const completed = habitLogRows.filter(l => l.completed).length;
  const habitCompletionPct = habitLogRows.length > 0 ? Math.round(completed / habitLogRows.length * 100) : 0;

  const measurements = await db.select().from(bodyMeasurements)
    .where(eq(bodyMeasurements.userId, userId));
  const periodMeasurements = measurements
    .filter(m => m.date >= start && m.date <= end && m.weightKg != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  const weightChange = periodMeasurements.length >= 2
    ? (periodMeasurements[periodMeasurements.length - 1].weightKg! - periodMeasurements[0].weightKg!)
    : null;

  const volumeTrend: { label: string; volume: number }[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = formatDate(d);
    const daySessions = sessions.filter(s => formatDate(new Date(s.startedAt)) === dateStr);
    const vol = daySessions.reduce((s, r) => s + (r.totalVolumeKg ?? 0), 0);
    volumeTrend.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), volume: Math.round(vol) });
  }

  const prompt = `You are a personal trainer writing a 10-day progress report for an athlete. Write a warm, motivational 2-3 paragraph summary. Data:
- Workouts: ${workoutsCompleted} in 10 days
- Total volume: ${Math.round(totalVolumeKg)} kg
- Avg session: ${avgSessionDurationMin} min
- Top muscles trained: ${topMuscles.join(', ') || 'none'}
- New PRs: ${newPRs.map(p => `${p.exercise} ${p.weightKg}kg×${p.reps}`).join(', ') || 'none'}
- Avg calories: ${avgCalories} kcal/day, protein: ${avgProteinG}g/day
- Habit completion: ${habitCompletionPct}%
- Weight change: ${weightChange != null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : 'not tracked'}
Write: 1) What went well, 2) What to focus on next 10 days, 3) One specific motivational line. Keep it personal and encouraging.`;

  let aiNarrative = 'Great work this period! Keep pushing forward.';
  try {
    const { data } = await supabase.functions.invoke('ai-trainer-chat', {
      body: {
        messages: [{ role: 'user', content: prompt }],
        context: { username: 'Athlete', goal: null, level: 1, weeklyWorkouts: workoutsCompleted, totalVolumeKg, recentMuscles: topMuscles },
      },
    });
    aiNarrative = data?.reply ?? aiNarrative;
  } catch {}

  return {
    periodStart: start, periodEnd: end,
    workoutsCompleted, totalVolumeKg, avgSessionDurationMin,
    topMuscles, newPRs, avgCalories, avgProteinG,
    habitCompletionPct, weightChange, aiNarrative, volumeTrend,
  };
}
