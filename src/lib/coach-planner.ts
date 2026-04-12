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
  muscleGroup: string,
  focusSection: string,
  fitnessLevel: string,
  goal: string | null,
  recoveryMap: Record<string, { status: string }>
): Promise<WorkoutPlan> {
  const allExercises = await db.select().from(exercises);
  const relevant = allExercises.filter(e => {
    if (e.primaryMuscle === muscleGroup) return true;
    try {
      return (JSON.parse(e.subMuscles || '[]') as string[]).includes(muscleGroup);
    } catch {
      return false;
    }
  });

  const prMap: Record<string, number | null> = {};
  await Promise.all(relevant.map(async (e) => {
    prMap[e.id] = await getUserPR(userId, e.name);
  }));

  const exerciseList = relevant.map(e => `${e.name} (PR: ${prMap[e.id] ? prMap[e.id] + 'kg' : 'none'})`).join('\n');
  const recoveryNote = recoveryMap[muscleGroup]
    ? `Muscle recovery: ${recoveryMap[muscleGroup].status}`
    : '';

  const prompt = `You are an expert personal trainer. Design a ${muscleGroup} workout focusing on ${focusSection}.
User: ${fitnessLevel} level, goal: ${goal ?? 'general fitness'}. ${recoveryNote}
Available exercises:
${exerciseList || 'Standard gym equipment available'}

Return ONLY valid JSON (no markdown):
{
  "title": "Workout name",
  "focusSection": "${focusSection}",
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
Include 4-5 exercises. suggestedWeightKg should be ~85% of PR if known, else a reasonable starting weight for ${fitnessLevel} level.`;

  const { data } = await supabase.functions.invoke('ai-trainer-chat', {
    body: {
      messages: [{ role: 'user', content: prompt }],
      context: { username: 'Athlete', goal, level: 1, weeklyWorkouts: 0, totalVolumeKg: 0, recentMuscles: [] },
    },
  });

  let parsed: any;
  try {
    parsed = JSON.parse(data?.reply ?? '{}');
  } catch {
    parsed = { title: `${muscleGroup} Workout`, focusSection, exercises: [], coachNote: "Let's crush it!" };
  }

  const plannedExercises: PlannedExercise[] = (parsed.exercises ?? []).map((pe: any) => {
    const match = relevant.find(e => e.name.toLowerCase() === pe.name?.toLowerCase()) ?? relevant[0];
    return {
      exerciseId: match?.id ?? '',
      name: pe.name ?? match?.name ?? '',
      primaryMuscle: match?.primaryMuscle ?? muscleGroup,
      sets: pe.sets ?? 3,
      reps: pe.reps ?? '8-10',
      suggestedWeightKg: pe.suggestedWeightKg ?? 0,
      notes: pe.notes ?? '',
    };
  }).filter((e: PlannedExercise) => e.exerciseId);

  return {
    title: parsed.title ?? `${muscleGroup} Workout`,
    focusSection,
    exercises: plannedExercises,
    coachNote: parsed.coachNote ?? "Let's crush it!",
  };
}
