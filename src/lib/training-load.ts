import { db } from '../db/client';
import { workoutSessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { formatDate } from '../utils';

export interface TrainingLoadResult {
  score: number;              // 0-100 (7-day rolling)
  label: 'Overreaching' | 'Optimal' | 'Maintaining' | 'Detraining';
  color: string;
  dailyLoads: { date: string; load: number }[];  // last 7 days
  trend: 'up' | 'down' | 'stable';               // vs previous 7 days
  trendPct: number;                                // % change
}

export async function calculateTrainingLoad(userId: string): Promise<TrainingLoadResult> {
  // Query all sessions for last 14 days (current 7 + previous 7 for trend)
  const now = new Date();
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const sessions = await db.select().from(workoutSessions)
    .where(eq(workoutSessions.userId, userId));

  // Filter to last 14 days
  const recent = sessions.filter(s => {
    if (!s.startedAt) return false;
    return new Date(s.startedAt) >= fourteenDaysAgo;
  });

  // Compute daily load for each of last 14 days
  // Daily load = sum of intensity scores for that day (or volume/duration fallback)
  const dailyMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dailyMap[formatDate(d)] = 0;
  }

  for (const s of recent) {
    const date = formatDate(new Date(s.startedAt));
    const load = s.intensityScore ??
      Math.min(100, Math.round(((s.totalVolumeKg ?? 0) / Math.max(1, (s.durationSeconds ?? 1) / 60)) / 2));
    dailyMap[date] = (dailyMap[date] ?? 0) + load;
  }

  const allDates = Object.keys(dailyMap).sort();
  const prev7 = allDates.slice(0, 7).map(d => dailyMap[d]);
  const curr7 = allDates.slice(7, 14).map(d => dailyMap[d]);

  const prevSum = prev7.reduce((a, b) => a + b, 0);
  const currSum = curr7.reduce((a, b) => a + b, 0);

  // Normalize to 0-100 scale (max theoretical = 7 days × 100 intensity = 700)
  const score = Math.min(100, Math.round((currSum / 700) * 100));

  // Trend
  const trendPct = prevSum > 0 ? Math.round(((currSum - prevSum) / prevSum) * 100) : 0;
  const trend: 'up' | 'down' | 'stable' =
    trendPct > 10 ? 'up' : trendPct < -10 ? 'down' : 'stable';

  // Label and color
  let label: TrainingLoadResult['label'];
  let color: string;
  if (score >= 75) {
    label = 'Overreaching';
    color = '#ef4444'; // red
  } else if (score >= 50) {
    label = 'Optimal';
    color = '#22c55e'; // green
  } else if (score >= 25) {
    label = 'Maintaining';
    color = '#f59e0b'; // amber
  } else {
    label = 'Detraining';
    color = '#9ca3af'; // gray
  }

  const dailyLoads = curr7.map((load, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      load: Math.min(100, load),
    };
  });

  return { score, label, color, dailyLoads, trend, trendPct };
}
