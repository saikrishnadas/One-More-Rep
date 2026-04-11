import { db } from './client';
import { exercises } from './schema';
import { EXERCISES } from '@/data/exercises';

export async function seedExercises() {
  const existing = await db.select().from(exercises).limit(1);
  if (existing.length > 0) return; // already seeded

  await db.insert(exercises).values(
    EXERCISES.map((e) => ({
      id: e.id,
      name: e.name,
      primaryMuscle: e.primaryMuscle,
      subMuscles: JSON.stringify(e.subMuscles),
      equipment: e.equipment,
      isCustom: false,
    }))
  );
}
