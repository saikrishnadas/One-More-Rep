import { db } from '@/db/client';
import { workoutSessions, workoutSets } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq } from 'drizzle-orm';

export async function syncWorkoutSession(sessionId: string) {
  // Load session from local DB
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));
  if (!session || session.syncedAt) return; // not found or already synced

  // Load sets for this session
  const sets = await db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.sessionId, sessionId));

  // Upsert session to Supabase
  const { error: sessionError } = await supabase.from('workout_sessions').upsert({
    id: session.id,
    user_id: session.userId,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    duration_seconds: session.durationSeconds,
    total_volume_kg: session.totalVolumeKg,
    set_count: session.setCount,
    notes: session.notes,
  });
  if (sessionError) throw sessionError;

  // Upsert sets to Supabase
  if (sets.length > 0) {
    const { error: setsError } = await supabase.from('workout_sets').upsert(
      sets.map((s) => ({
        id: s.id,
        session_id: s.sessionId,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        weight_kg: s.weightKg,
        reps: s.reps,
        is_pr: s.isPr,
        completed_at: s.completedAt,
      }))
    );
    if (setsError) throw setsError;
  }

  // Mark as synced in local DB
  await db
    .update(workoutSessions)
    .set({ syncedAt: new Date() })
    .where(eq(workoutSessions.id, sessionId));
}
