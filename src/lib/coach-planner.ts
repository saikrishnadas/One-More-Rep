import { supabase } from '@/lib/supabase';
import { db } from '@/db/client';
import { workoutSets, workoutSessions, exercises } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

function stripMarkdown(text: string): string {
  return text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
}

/** Returns the average RPE from the user's last workout session, or null if unavailable */
async function getLastSessionRpe(userId: string): Promise<{ rpe: number | null; sessionDate: string | null }> {
  try {
    const sessions = await db.select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(1);
    if (!sessions.length) return { rpe: null, sessionDate: null };
    const last = sessions[0];
    const rpe = (last as any).sessionRpe ?? null;
    const date = last.startedAt ? new Date(last.startedAt).toLocaleDateString() : null;
    return { rpe, sessionDate: date };
  } catch {
    return { rpe: null, sessionDate: null };
  }
}

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

// ---------- Fallback plan (no AI required) ----------

const COMPOUND_KEYWORDS = ['press', 'squat', 'deadlift', 'row', 'pull', 'dip', 'lunge', 'clean', 'snatch', 'chin'];

function isCompound(name: string): boolean {
  const lower = name.toLowerCase();
  return COMPOUND_KEYWORDS.some(k => lower.includes(k));
}

/** Default starting weight when user has no PR */
function defaultWeightKg(name: string, fitnessLevel: string): number {
  const compound = isCompound(name);
  if (fitnessLevel === 'beginner') return compound ? 20 : 10;
  if (fitnessLevel === 'advanced')  return compound ? 80 : 35;
  return compound ? 50 : 20; // intermediate
}

/** Sets + reps prescription based on goal */
function prescribeVolume(goal: string | null): { sets: number; reps: string } {
  switch (goal) {
    case 'strength':     return { sets: 5, reps: '3-5' };
    case 'muscle_gain':  return { sets: 4, reps: '8-12' };
    case 'weight_loss':  return { sets: 3, reps: '12-15' };
    case 'endurance':    return { sets: 3, reps: '15-20' };
    default:             return { sets: 4, reps: '8-10' };
  }
}

/** Apply RPE-based weight multiplier */
function applyRpeAdjustment(weightKg: number, rpe: number | null): number {
  if (rpe === null) return weightKg;
  if (rpe >= 8) return Math.round(weightKg * 0.9 / 2.5) * 2.5;  // reduce 10%, round to 2.5
  if (rpe <= 4) return Math.round(weightKg * 1.05 / 2.5) * 2.5; // increase 5%, round to 2.5
  return weightKg;
}

function buildFallbackPlan(
  relevant: { id: string; name: string; primaryMuscle: string }[],
  prMap: Record<string, number | null>,
  muscleGroups: string[],
  focusSections: string[],
  fitnessLevel: string,
  goal: string | null,
  lastRpe: number | null,
): WorkoutPlan {
  // Shuffle deterministically by name length to get variety
  const shuffled = [...relevant].sort((a, b) => (a.name.length % 7) - (b.name.length % 7));

  // Pick up to 5 exercises, ensuring we cover all selected muscle groups first
  const picked: typeof relevant = [];
  const usedMuscles = new Set<string>();

  // First pass: one compound per muscle group
  for (const muscle of muscleGroups) {
    const ex = shuffled.find(e => e.primaryMuscle === muscle && isCompound(e.name) && !picked.includes(e));
    if (ex) { picked.push(ex); usedMuscles.add(muscle); }
  }

  // Second pass: fill remaining slots with any relevant exercise not yet picked
  for (const ex of shuffled) {
    if (picked.length >= 5) break;
    if (!picked.includes(ex)) picked.push(ex);
  }

  const { sets, reps } = prescribeVolume(goal);
  const rpeNote = lastRpe !== null
    ? lastRpe >= 8 ? '(weights reduced — recovery day)' : lastRpe <= 4 ? '(weights increased — push harder!)' : ''
    : '';

  const plannedExercises: PlannedExercise[] = picked.map(ex => {
    const pr = prMap[ex.id];
    const base = pr ? Math.round(pr * 0.85 / 2.5) * 2.5 : defaultWeightKg(ex.name, fitnessLevel);
    const weight = applyRpeAdjustment(base, lastRpe);
    return {
      exerciseId: ex.id,
      name: ex.name,
      primaryMuscle: ex.primaryMuscle,
      sets,
      reps,
      suggestedWeightKg: weight,
      notes: pr ? `Your PR is ${pr}kg — aiming for ~${weight}kg today ${rpeNote}`.trim() : `Start at ${weight}kg, adjust as needed`,
    };
  });

  const focusLabel = focusSections.length ? ` — ${focusSections.join(' & ')}` : '';
  return {
    title: `${muscleGroups.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')} Day${focusLabel}`,
    focusSection: focusSections.join(', '),
    exercises: plannedExercises,
    coachNote: `Offline plan based on your history. ${rpeNote || "Give it your best today! 💪"}`,
  };
}

// ---------- PR lookup ----------

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
  const { rpe: lastRpe, sessionDate } = await getLastSessionRpe(userId);
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

  // Cap exercise list to 15 entries — prioritise compounds with known PRs to keep prompt small
  const sortedRelevant = [...relevant].sort((a, b) => {
    const aScore = (isCompound(a.name) ? 2 : 0) + (prMap[a.id] ? 1 : 0);
    const bScore = (isCompound(b.name) ? 2 : 0) + (prMap[b.id] ? 1 : 0);
    return bScore - aScore;
  });
  const cappedRelevant = sortedRelevant.slice(0, 15);
  const exerciseList = cappedRelevant.map(e => `${e.name} (PR: ${prMap[e.id] ? prMap[e.id] + 'kg' : 'none'})`).join('\n');
  const recoveryNotes = muscleGroups
    .filter(m => recoveryMap[m])
    .map(m => `${m}: ${recoveryMap[m].status}`)
    .join(', ');
  const focusLabel = focusSections.length ? ` focusing on ${focusSections.join(', ')}` : '';

  // Build RPE-based adjustment note for the coach
  let rpeContext = '';
  if (lastRpe !== null) {
    if (lastRpe >= 8) {
      rpeContext = `Last session (${sessionDate}) RPE was ${lastRpe}/10 (very hard). Reduce suggested weights by ~10% today to allow recovery. Add a rest note.`;
    } else if (lastRpe <= 4) {
      rpeContext = `Last session (${sessionDate}) RPE was ${lastRpe}/10 (too easy). Increase suggested weights by ~5-10% today to progress.`;
    } else {
      rpeContext = `Last session (${sessionDate}) RPE was ${lastRpe}/10 (on track). Maintain current weights or add a small increment.`;
    }
  }

  const prompt = `Design a ${muscleGroups.join('+')} workout for a ${fitnessLevel} (goal: ${goal ?? 'general fitness'}).${rpeContext ? ` ${rpeContext}` : ''}
Exercises: ${exerciseList || 'standard gym equipment'}

Reply with ONLY this JSON (no markdown, no extra text):
{"title":"X","note":"1 tip","ex":[{"n":"name","s":4,"r":"8-10","w":60}]}
Pick exactly 4 exercises. w = ~85% of PR kg if known, else beginner/intermediate/advanced default.`;

  // Try AI plan — fall back to local plan if AI fails or returns no exercises
  let parsed: any = null;
  try {
    const { data, error } = await supabase.functions.invoke('ai-trainer-chat', {
      body: {
        messages: [{ role: 'user', content: prompt }],
        context: { username: 'Athlete', goal, level: 1, weeklyWorkouts: 0, totalVolumeKg: 0, recentMuscles: muscleGroups },
        systemOverride: 'You are an expert personal trainer. Reply ONLY with raw JSON — no markdown, no code fences, nothing else.',
        maxTokens: 1500,
      },
    });
    const reply: string = data?.reply ?? '';
    console.log('[coach-planner] AI reply:', reply.slice(0, 300));
    if (error) {
      console.log('[coach-planner] invoke error:', error);
    } else {
      try {
        parsed = JSON.parse(stripMarkdown(reply));
      } catch {
        const match = reply.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch (e2) {
            console.log('[coach-planner] JSON parse failed:', e2);
          }
        }
      }
    }
  } catch (e) {
    console.log('[coach-planner] network error:', e);
  }

  // Support both compact {ex:[{n,s,r,w}]} and legacy {exercises:[{name,sets,reps,suggestedWeightKg}]} formats
  const aiExercises: any[] = parsed?.ex ?? parsed?.exercises ?? [];

  // If AI gave us exercises, map them to DB entries
  if (aiExercises.length > 0) {
    const plannedExercises: PlannedExercise[] = aiExercises.map((pe: any, i: number) => {
      const peName: string = pe.n ?? pe.name ?? '';
      const dbMatch = relevant.find(e => e.name.toLowerCase() === peName.toLowerCase());
      const exerciseId = dbMatch ? dbMatch.id : `coach-${Date.now()}-${i}`;
      return {
        exerciseId,
        name: peName || dbMatch?.name || 'Exercise',
        primaryMuscle: dbMatch?.primaryMuscle ?? muscleGroups[0],
        sets: pe.s ?? pe.sets ?? 3,
        reps: pe.r ?? pe.reps ?? '8-10',
        suggestedWeightKg: pe.w ?? pe.suggestedWeightKg ?? 0,
        notes: pe.notes ?? '',
      };
    });
    return {
      title: parsed.title ?? `${muscleGroups.join(' + ')} Workout`,
      focusSection: focusSections.join(', '),
      exercises: plannedExercises,
      coachNote: parsed.note ?? parsed.coachNote ?? "Let's crush it!",
    };
  }

  // Local fallback — always works even offline
  return buildFallbackPlan(relevant, prMap, muscleGroups, focusSections, fitnessLevel, goal, lastRpe);
}
