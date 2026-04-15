import { db } from './client';
import { exercises } from './schema';
import { EXERCISES } from '@/data/exercises';
import { like } from 'drizzle-orm';

export async function seedExercises() {
  const existing = await db.select().from(exercises).limit(1);
  if (existing.length === 0) {
    // Fresh database — insert everything
    await db.insert(exercises).values(
      EXERCISES.map((e) => ({
        id: e.id,
        name: e.name,
        primaryMuscle: e.primaryMuscle,
        subMuscles: JSON.stringify(e.subMuscles),
        equipment: e.equipment,
        exerciseType: e.exerciseType ?? 'strength',
        isCustom: false,
      }))
    );
    return;
  }

  // Database already seeded — check if Hyrox exercises are missing and insert them
  const hyroxExisting = await db
    .select()
    .from(exercises)
    .where(like(exercises.id, 'ex-h%'))
    .limit(1);

  if (hyroxExisting.length === 0) {
    const hyroxExercises = EXERCISES.filter((e) => e.id.startsWith('ex-h'));
    await db.insert(exercises).values(
      hyroxExercises.map((e) => ({
        id: e.id,
        name: e.name,
        primaryMuscle: e.primaryMuscle,
        subMuscles: JSON.stringify(e.subMuscles),
        equipment: e.equipment,
        exerciseType: e.exerciseType ?? 'strength',
        isCustom: false,
      }))
    );
  }
}
