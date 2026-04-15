import { randomUUID } from 'expo-crypto';

export function generateId(): string {
  return randomUUID();
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return `${Math.round(kg)}`;
}

/** XP required to reach a given level */
export function xpForLevel(level: number): number {
  return Math.round(200 * Math.pow(level, 1.8));
}

/** Level from total XP */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

/** XP earned for a completed workout */
export function calculateWorkoutXp(totalVolumeKg: number, prCount: number): number {
  return 20 + Math.floor(totalVolumeKg / 1000) * 5 + prCount * 40;
}

export const LEVEL_TITLES: Record<string, string> = {
  rookie:  'Rookie',    // 1-5
  grinder: 'Grinder',   // 6-10
  athlete: 'Athlete',   // 11-20
  beast:   'Beast',     // 21-35
  legend:  'Legend',    // 36-50
};

export function getLevelTitle(level: number): string {
  if (level <= 5)  return LEVEL_TITLES.rookie;
  if (level <= 10) return LEVEL_TITLES.grinder;
  if (level <= 20) return LEVEL_TITLES.athlete;
  if (level <= 35) return LEVEL_TITLES.beast;
  return LEVEL_TITLES.legend;
}
