import { db } from '../db/client';
import { workoutSessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { readSleepData, isHealthPlatformAvailable } from './health-platform';
import { formatDate } from './utils';

export interface SleepPerformancePoint {
  sleepHours: number;
  intensityScore: number;
  date: string;
}

export interface SleepPerformanceResult {
  hasEnoughData: boolean;        // need at least 5 paired data points
  dataPoints: SleepPerformancePoint[];
  avgPerformanceGoodSleep: number;   // avg intensity when sleep >= 7h
  avgPerformancePoorSleep: number;   // avg intensity when sleep < 6h
  differencePercent: number;          // % difference (positive = good sleep helps)
  insight: string;                    // e.g. "You're 12% stronger after 7+ hours sleep"
}

export async function analyzeSleepPerformance(userId: string): Promise<SleepPerformanceResult> {
  const empty: SleepPerformanceResult = {
    hasEnoughData: false,
    dataPoints: [],
    avgPerformanceGoodSleep: 0,
    avgPerformancePoorSleep: 0,
    differencePercent: 0,
    insight: '',
  };

  if (!isHealthPlatformAvailable()) return empty;

  try {
    // Get last 30 days of workout sessions
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sessions = await db.select().from(workoutSessions)
      .where(eq(workoutSessions.userId, userId));

    const recentSessions = sessions.filter(s => {
      if (!s.startedAt || !s.durationSeconds || s.durationSeconds <= 0) return false;
      return new Date(s.startedAt) >= thirtyDaysAgo;
    });

    // For each workout session, get the previous night's sleep
    const dataPoints: SleepPerformancePoint[] = [];

    for (const session of recentSessions) {
      const workoutDate = formatDate(new Date(session.startedAt));

      // Get sleep from the night before this workout
      try {
        const sleep = await readSleepData(workoutDate);
        if (sleep.totalHours > 0) {
          const intensity = session.intensityScore ??
            Math.min(100, Math.round(((session.totalVolumeKg ?? 0) / Math.max(1, (session.durationSeconds ?? 1) / 60)) / 2));

          dataPoints.push({
            sleepHours: Math.round(sleep.totalHours * 10) / 10,
            intensityScore: intensity,
            date: workoutDate,
          });
        }
      } catch {
        // Skip if sleep data unavailable for this date
      }
    }

    if (dataPoints.length < 5) return empty;

    // Split into good sleep (>= 7h) and poor sleep (< 6h)
    const goodSleep = dataPoints.filter(p => p.sleepHours >= 7);
    const poorSleep = dataPoints.filter(p => p.sleepHours < 6);

    const avgGood = goodSleep.length > 0
      ? Math.round(goodSleep.reduce((s, p) => s + p.intensityScore, 0) / goodSleep.length)
      : 0;
    const avgPoor = poorSleep.length > 0
      ? Math.round(poorSleep.reduce((s, p) => s + p.intensityScore, 0) / poorSleep.length)
      : 0;

    const diffPct = avgPoor > 0
      ? Math.round(((avgGood - avgPoor) / avgPoor) * 100)
      : 0;

    let insight = '';
    if (goodSleep.length >= 2 && poorSleep.length >= 2 && diffPct > 0) {
      insight = `You're ${diffPct}% stronger after 7+ hours sleep`;
    } else if (goodSleep.length >= 2 && poorSleep.length < 2) {
      insight = `Avg intensity: ${avgGood} on good sleep nights`;
    } else {
      insight = 'Keep tracking — more data needed for insights';
    }

    return {
      hasEnoughData: true,
      dataPoints,
      avgPerformanceGoodSleep: avgGood,
      avgPerformancePoorSleep: avgPoor,
      differencePercent: Math.max(0, diffPct),
      insight,
    };
  } catch {
    return empty;
  }
}
