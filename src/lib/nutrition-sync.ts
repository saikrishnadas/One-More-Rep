import { db } from '@/db/client';
import { nutritionLogs } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq, and } from 'drizzle-orm';

export async function syncNutritionLogs(userId: string, date: string) {
  // Get unsynced logs for this user/date
  const rows = await db
    .select()
    .from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, date)));

  const unsynced = rows.filter((r) => !r.syncedAt);
  if (unsynced.length === 0) return;

  const { error } = await supabase.from('nutrition_logs').upsert(
    unsynced.map((r) => ({
      id: r.id,
      user_id: r.userId,
      date: r.date,
      meal_type: r.mealType,
      food_name: r.foodName,
      calories: r.calories,
      protein_g: r.proteinG,
      carbs_g: r.carbsG,
      fat_g: r.fatG,
      fiber_g: r.fiberG,
      source: r.source,
    }))
  );
  if (error) throw error;

  // Mark as synced
  const now = new Date();
  for (const r of unsynced) {
    await db
      .update(nutritionLogs)
      .set({ syncedAt: now })
      .where(eq(nutritionLogs.id, r.id));
  }
}
