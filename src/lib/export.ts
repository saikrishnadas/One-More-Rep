import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from '@/db/client';
import { workoutSessions, workoutSets, exercises, nutritionLogs } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';
import type { PeriodReport } from '@/lib/report-generator';

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

/**
 * Export workouts as CSV.
 * Columns: date,session_name,exercise,set_number,weight_kg,reps,is_pr,duration_seconds
 */
export async function exportWorkoutsCSV(userId: string, days?: number): Promise<void> {
  // Query sessions for user, optionally filtered by date
  let sessions;
  if (days !== undefined) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    sessions = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.startedAt, cutoff)));
  } else {
    sessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId));
  }

  // Build exercise name map
  const allExercises = await db.select().from(exercises);
  const exerciseMap: Record<string, string> = {};
  for (const ex of allExercises) {
    exerciseMap[ex.id] = ex.name;
  }

  const headers = ['date', 'session_name', 'exercise', 'set_number', 'weight_kg', 'reps', 'is_pr', 'duration_seconds'];
  const rows: string[][] = [];

  for (const session of sessions) {
    const sets = await db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.sessionId, session.id));

    const sessionDate = session.startedAt ? formatDate(new Date(session.startedAt)) : '';
    const sessionName = session.name ?? '';
    const durationSeconds = session.durationSeconds != null ? String(session.durationSeconds) : '';

    for (const set of sets) {
      const exerciseName = exerciseMap[set.exerciseId] ?? set.exerciseId;
      rows.push([
        sessionDate,
        sessionName,
        exerciseName,
        String(set.setNumber),
        String(set.weightKg),
        String(set.reps),
        set.isPr ? 'true' : 'false',
        durationSeconds,
      ]);
    }
  }

  const csv = toCSV(headers, rows);
  const uri = (FileSystem.cacheDirectory ?? '') + 'workouts_export.csv';
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export Workouts' });
}

/**
 * Export a 10-day PeriodReport as a formatted CSV.
 * Opens the system share sheet so the user can save or send the file.
 */
export async function exportReportCSV(report: PeriodReport): Promise<void> {
  const lines: string[] = [];

  // ── Summary ──────────────────────────────────────────────────
  lines.push('=== 10-Day Progress Report ===');
  lines.push(`Period,${report.periodStart} to ${report.periodEnd}`);
  lines.push('');
  lines.push('--- Summary ---');
  lines.push(`Workouts completed,${report.workoutsCompleted}`);
  lines.push(`Total volume (kg),${Math.round(report.totalVolumeKg)}`);
  lines.push(`Avg session duration (min),${report.avgSessionDurationMin}`);
  lines.push(`Habit completion (%),${report.habitCompletionPct}`);
  if (report.weightChange != null) {
    lines.push(`Body weight change (kg),${report.weightChange > 0 ? '+' : ''}${report.weightChange.toFixed(1)}`);
  }
  lines.push('');

  // ── Nutrition ─────────────────────────────────────────────────
  lines.push('--- Nutrition Averages ---');
  lines.push(`Avg calories / day,${report.avgCalories}`);
  lines.push(`Avg protein / day (g),${report.avgProteinG}`);
  lines.push('');

  // ── Volume trend ──────────────────────────────────────────────
  lines.push('--- Volume Trend ---');
  lines.push('Day,Volume (kg)');
  for (const d of report.volumeTrend) {
    lines.push(`${d.label},${d.volume}`);
  }
  lines.push('');

  // ── PRs ───────────────────────────────────────────────────────
  if (report.newPRs.length > 0) {
    lines.push('--- New Personal Records ---');
    lines.push('Exercise,Weight (kg),Reps');
    for (const pr of report.newPRs) {
      lines.push(`${pr.exercise},${pr.weightKg},${pr.reps}`);
    }
    lines.push('');
  }

  // ── Top muscles ───────────────────────────────────────────────
  if (report.topMuscles.length > 0) {
    lines.push('--- Most Trained Muscles ---');
    lines.push(report.topMuscles.join(', '));
    lines.push('');
  }

  // ── Coach narrative ───────────────────────────────────────────
  lines.push('--- Coach Notes ---');
  lines.push(report.aiNarrative.replace(/,/g, ' '));

  const csv = lines.join('\n');
  const filename = `gym_buddy_report_${report.periodStart}_to_${report.periodEnd}.csv`;
  const uri = (FileSystem.cacheDirectory ?? '') + filename;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export 10-Day Report' });
}

/**
 * Export nutrition logs as CSV.
 * Columns: date,meal_type,food_name,calories,protein_g,carbs_g,fat_g,fiber_g
 */
export async function exportNutritionCSV(userId: string, days?: number): Promise<void> {
  // Query all nutrition logs for user
  const allLogs = await db
    .select()
    .from(nutritionLogs)
    .where(eq(nutritionLogs.userId, userId));

  // Filter by date string if days provided
  let logs = allLogs;
  if (days !== undefined) {
    const cutoffDate = formatDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    logs = allLogs.filter(log => log.date >= cutoffDate);
  }

  const headers = ['date', 'meal_type', 'food_name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'];
  const rows: string[][] = logs.map(log => [
    log.date,
    log.mealType ?? '',
    log.foodName,
    String(log.calories),
    String(log.proteinG ?? 0),
    String(log.carbsG ?? 0),
    String(log.fatG ?? 0),
    String(log.fiberG ?? 0),
  ]);

  const csv = toCSV(headers, rows);
  const uri = (FileSystem.cacheDirectory ?? '') + 'nutrition_export.csv';
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export Nutrition' });
}
