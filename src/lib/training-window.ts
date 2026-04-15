import { db } from '../db/client';
import { workoutSessions } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface BracketData {
  name: 'Morning' | 'Afternoon' | 'Evening';
  range: string;
  sessionCount: number;
  avgScore: number;
  isBest: boolean;
}

export interface TrainingWindowResult {
  hasEnoughData: boolean;
  brackets: BracketData[];
  bestBracket: BracketData | null;
  advantage: number;
}

function getTimeBracket(hour: number): 'Morning' | 'Afternoon' | 'Evening' | null {
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour <= 22) return 'Evening';
  return null;
}

export async function analyzeTrainingWindows(userId: string): Promise<TrainingWindowResult> {
  const empty: TrainingWindowResult = {
    hasEnoughData: false,
    brackets: [],
    bestBracket: null,
    advantage: 0,
  };

  try {
    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId));

    const buckets: Record<string, { scores: number[]; count: number }> = {
      Morning: { scores: [], count: 0 },
      Afternoon: { scores: [], count: 0 },
      Evening: { scores: [], count: 0 },
    };

    for (const s of sessions) {
      if (!s.startedAt || !s.durationSeconds || s.durationSeconds <= 0) continue;
      const hour = new Date(s.startedAt).getHours();
      const bracket = getTimeBracket(hour);
      if (!bracket) continue;
      const score = s.intensityScore ?? ((s.totalVolumeKg ?? 0) / (s.durationSeconds / 60));
      buckets[bracket].scores.push(score);
      buckets[bracket].count++;
    }

    const totalSessions = Object.values(buckets).reduce((sum, b) => sum + b.count, 0);
    const bracketsWithData = Object.values(buckets).filter((b) => b.count >= 2).length;
    if (totalSessions < 10 || bracketsWithData < 2) return empty;

    const bracketNames: Array<'Morning' | 'Afternoon' | 'Evening'> = ['Morning', 'Afternoon', 'Evening'];
    const ranges: Record<string, string> = {
      Morning: '5 AM – 12 PM',
      Afternoon: '12 – 5 PM',
      Evening: '5 – 10 PM',
    };

    const allScores = Object.values(buckets).flatMap((b) => b.scores);
    const overallAvg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

    const brackets: BracketData[] = bracketNames.map((name) => {
      const b = buckets[name];
      const avg = b.scores.length > 0 ? b.scores.reduce((a, c) => a + c, 0) / b.scores.length : 0;
      return { name, range: ranges[name], sessionCount: b.count, avgScore: Math.round(avg), isBest: false };
    });

    const validBrackets = brackets.filter((b) => b.sessionCount >= 2);
    if (validBrackets.length < 2) return empty;

    const best = validBrackets.reduce((a, b) => (a.avgScore > b.avgScore ? a : b));
    best.isBest = true;

    const advantage = overallAvg > 0 ? Math.round(((best.avgScore - overallAvg) / overallAvg) * 100) : 0;

    return { hasEnoughData: true, brackets, bestBracket: best, advantage: Math.max(0, advantage) };
  } catch {
    return empty;
  }
}
