import { supabase } from '@/lib/supabase';
import { db } from '@/db/client';
import { workoutSets, workoutSessions, exercises } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const MUSCLE_GROUPS = [
  { key: 'chest',     label: 'Chest',      sections: ['Upper Chest', 'Middle Chest', 'Lower Chest'] },
  { key: 'back',      label: 'Back',       sections: ['Lats', 'Mid Back', 'Lower Back'] },
  { key: 'shoulders', label: 'Shoulders',  sections: ['Front Delts', 'Side Delts', 'Rear Delts'] },
  { key: 'biceps',    label: 'Biceps',     sections: ['Long Head', 'Short Head', 'Brachialis'] },
  { key: 'triceps',   label: 'Triceps',    sections: ['Long Head', 'Lateral Head', 'Medial Head'] },
  { key: 'legs',      label: 'Legs',       sections: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
  { key: 'core',      label: 'Core',       sections: ['Upper Abs', 'Lower Abs', 'Obliques'] },
] as const;

export type MuscleGroupKey = typeof MUSCLE_GROUPS[number]['key'];

export interface PlannedExercise {
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  sets: number;
  reps: string;
  suggestedWeightKg: number;
  notes: string;
}

export interface WorkoutPlan {
  title: string;
  focusSection: string;
  exercises: PlannedExercise[];
  coachNote: string;
}

async function getUserPR(userId: string, exerciseName: string): Promise<number | null> {
  const sessions = await db.select({ id: workoutSessions.id })
    .from(workoutSessions).where(eq(workoutSessions.userId, userId));
  const sessionIds = new Set(sessions.map(s => s.id));
  const allSets = await db.select().from(workoutSets);
  const exRows = await db.select().from(exercises);
  const ex = exRows.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
  if (!ex) return null;
  const userSets = allSets.filter(s => sessionIds.has(s.sessionId) && s.exerciseId === ex.id);
  if (userSets.length === 0) return null;
  return Math.max(...userSets.map(s => s.weightKg));
}

export async function generateWorkoutPlan(
  userId: string,
  muscleGroups: string[],
  focusSections: string[],
  fitnessLevel: string,
  goal: string | null,
  recoveryMap: Record<string, { status: string }>
): Promise<WorkoutPlan> {
  const allExercises = await db.select().from(exercises);
  const relevant = allExercises.filter(e => {
    if (muscleGroups.includes(e.primaryMuscle)) return true;
    try {
      return (JSON.parse(e.subMuscles || '[]') as string[]).some(m => muscleGroups.includes(m));
    } catch {
      return false;
    }
  });

  const prMap: Record<string, number | null> = {};
  await Promise.all(relevant.map(async (e) => {
    prMap[e.id] = await getUserPR(userId, e.name);
  }));

  const exerciseList = relevant.map(e => `${e.name} (PR: ${prMap[e.id] ? prMap[e.id] + 'kg' : 'none'})`).join('\n');
  const recoveryNotes = muscleGroups
    .filter(m => recoveryMap[m])
    .map(m => `${m}: ${recoveryMap[m].status}`)
    .join(', ');
  const focusLabel = focusSections.length ? ` focusing on ${focusSections.join(', ')}` : '';

  const prompt = `You are an expert personal trainer. Design a ${muscleGroups.join(' + ')} workout${focusLabel}.
User: ${fitnessLevel} level, goal: ${goal ?? 'general fitness'}. ${recoveryNotes ? `Recovery: ${recoveryNotes}` : ''}
Available exercises:
${exerciseList || 'Standard gym equipment available'}

Return ONLY valid JSON (no markdown):
{
  "title": "Workout name",
  "coachNote": "1-2 sentence coaching tip",
  "exercises": [
    {
      "name": "Exercise name (must match available list exactly if provided)",
      "sets": 4,
      "reps": "8-10",
      "suggestedWeightKg": 60,
      "notes": "Form tip or PR note"
    }
  ]
}
Include 4-6 exercises. suggestedWeightKg should be ~85% of PR if known, else a reasonable starting weight for ${fitnessLevel} level.`;

  const { data } = await supabase.functions.invoke('ai-trainer-chat', {
    body: {
      messages: [{ role: 'user', content: prompt }],
      context: { username: 'Athlete', goal, level: 1, weeklyWorkouts: 0, totalVolumeKg: 0, recentMuscles: muscleGroups },
    },
  });

  let parsed: any;
  try {
    parsed = JSON.parse(data?.reply ?? '{}');
  } catch {
    parsed = { title: `${muscleGroups.join(' + ')} Workout`, exercises: [], coachNote: "Let's crush it!" };
  }

  // Map AI exercises to DB entries — use a unique slot ID to avoid dedup collisions in the workout store
  const plannedExercises: PlannedExercise[] = (parsed.exercises ?? []).map((pe: any, i: number) => {
    const dbMatch = relevant.find(e => e.name.toLowerCase() === pe.name?.toLowerCase());
    // Use DB id if matched, otherwise generate a unique coach slot id
    const exerciseId = dbMatch ? dbMatch.id : `coach-${Date.now()}-${i}`;
    return {
      exerciseId,
      name: pe.name ?? dbMatch?.name ?? 'Exercise',
      primaryMuscle: dbMatch?.primaryMuscle ?? muscleGroups[0],
      sets: pe.sets ?? 3,
      reps: pe.reps ?? '8-10',
      suggestedWeightKg: pe.suggestedWeightKg ?? 0,
      notes: pe.notes ?? '',
    };
  });

  return {
    title: parsed.title ?? `${muscleGroups.join(' + ')} Workout`,
    focusSection: focusSections.join(', '),
    exercises: plannedExercises,
    coachNote: parsed.coachNote ?? "Let's crush it!",
  };
}
