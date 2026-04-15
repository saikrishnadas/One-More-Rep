import { db } from '@/db/client';
import { profiles as profilesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';
import { levelFromXp, xpForLevel } from '@/lib/utils';

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'first_workout',   name: 'First Blood',      icon: '🩸', description: 'Complete your first workout' },
  { id: 'workout_5',       name: 'Regular',           icon: '💪', description: 'Complete 5 workouts' },
  { id: 'workout_10',      name: 'Dedicated',         icon: '🏋️', description: 'Complete 10 workouts' },
  { id: 'workout_50',      name: 'Iron Will',         icon: '🔩', description: 'Complete 50 workouts' },
  { id: 'pr_first',        name: 'Personal Best',     icon: '🏆', description: 'Set your first PR' },
  { id: 'pr_10',           name: 'PR Machine',        icon: '🎰', description: 'Set 10 PRs' },
  { id: 'habit_streak_7',  name: 'Week Warrior',      icon: '🗓️', description: 'Maintain a 7-day habit streak' },
  { id: 'habit_streak_30', name: 'Monthly Champion',  icon: '🌟', description: 'Maintain a 30-day habit streak' },
  { id: 'level_5',         name: 'Rising Star',       icon: '⭐', description: 'Reach Level 5' },
  { id: 'level_10',        name: 'Grinder',           icon: '⚙️', description: 'Reach Level 10' },
  { id: 'level_20',        name: 'Beast Mode',        icon: '🦁', description: 'Reach Level 20' },
  { id: 'nutrition_7',     name: 'Meal Prepper',      icon: '🥗', description: 'Log nutrition 7 days in a row' },
  { id: 'volume_1000',     name: 'Volume King',       icon: '👑', description: 'Lift 1,000 kg total volume' },
  { id: 'volume_10000',    name: 'Legendary Lifter',  icon: '🌌', description: 'Lift 10,000 kg total volume' },
  { id: 'early_bird',      name: 'Early Bird',        icon: '🌅', description: 'Complete a workout before 8am' },
];

export interface XpResult {
  xpEarned: number;
  newXp: number;
  newLevel: number;
  oldLevel: number;
  leveledUp: boolean;
  newBadges: BadgeDef[];
}

export interface XpContext {
  workoutCount?: number;
  prCount?: number;
  totalVolumeKg?: number;
  habitStreak?: number;
  nutritionStreak?: number;
  workoutHour?: number;
  earnedBadgeIds?: string[];
}

export async function awardXp(
  userId: string,
  xpAmount: number,
  ctx: XpContext = {}
): Promise<XpResult> {
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, userId));
  const oldXp = profile?.xp ?? 0;
  const oldLevel = profile?.level ?? 1;

  const newXp = oldXp + xpAmount;
  const newLevel = levelFromXp(newXp);
  const leveledUp = newLevel > oldLevel;

  await db.update(profilesTable)
    .set({ xp: newXp, level: newLevel })
    .where(eq(profilesTable.id, userId));

  await supabase.from('profiles').update({ xp: newXp, level: newLevel }).eq('id', userId);

  const newBadges: BadgeDef[] = [];
  const earned = new Set(ctx.earnedBadgeIds ?? []);

  function maybeUnlock(badgeId: string, condition: boolean) {
    if (condition && !earned.has(badgeId)) {
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) { newBadges.push(badge); earned.add(badgeId); }
    }
  }

  maybeUnlock('first_workout',   (ctx.workoutCount ?? 0) >= 1);
  maybeUnlock('workout_5',       (ctx.workoutCount ?? 0) >= 5);
  maybeUnlock('workout_10',      (ctx.workoutCount ?? 0) >= 10);
  maybeUnlock('workout_50',      (ctx.workoutCount ?? 0) >= 50);
  maybeUnlock('pr_first',        (ctx.prCount ?? 0) >= 1);
  maybeUnlock('pr_10',           (ctx.prCount ?? 0) >= 10);
  maybeUnlock('habit_streak_7',  (ctx.habitStreak ?? 0) >= 7);
  maybeUnlock('habit_streak_30', (ctx.habitStreak ?? 0) >= 30);
  maybeUnlock('level_5',         newLevel >= 5);
  maybeUnlock('level_10',        newLevel >= 10);
  maybeUnlock('level_20',        newLevel >= 20);
  maybeUnlock('nutrition_7',     (ctx.nutritionStreak ?? 0) >= 7);
  maybeUnlock('volume_1000',     (ctx.totalVolumeKg ?? 0) >= 1000);
  maybeUnlock('volume_10000',    (ctx.totalVolumeKg ?? 0) >= 10000);
  maybeUnlock('early_bird',      (ctx.workoutHour ?? 99) < 8);

  for (const badge of newBadges) {
    await supabase.from('user_badges').upsert(
      { user_id: userId, badge_id: badge.id, earned_at: new Date().toISOString() },
      { onConflict: 'user_id,badge_id' }
    ).catch(() => {});
  }

  return { xpEarned: xpAmount, newXp, newLevel, oldLevel, leveledUp, newBadges };
}

export async function fetchEarnedBadgeIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);
  return (data ?? []).map((r: any) => r.badge_id);
}

export function calcHabitStreak(
  logs: { habitId: string; date: string; completed: boolean }[],
  habitId: string
): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const log = logs.find(l => l.habitId === habitId && l.date === dateStr);
    if (log?.completed) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function calculateHabitXp(completedCount: number): number {
  return completedCount * 5;
}

export const MEAL_LOG_XP = 2;
