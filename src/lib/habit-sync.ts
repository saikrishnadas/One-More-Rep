import { db } from '@/db/client';
import { habits as habitsTable, habitLogs as habitLogsTable } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

export async function syncHabits(userId: string) {
  try {
    // Sync habits (insert all, ignore conflicts)
    const localHabits = await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
    for (const h of localHabits) {
      await supabase.from('habits').upsert({
        id: h.id,
        user_id: h.userId,
        name: h.name,
        icon: h.icon,
        habit_type: h.habitType,
        target_count: h.targetCount,
        reminder_time: h.reminderTime,
      }, { onConflict: 'id' });
    }

    // Sync unsynced habit logs
    const unsyncedLogs = await db.select().from(habitLogsTable)
      .where(eq(habitLogsTable.userId, userId));
    const toSync = unsyncedLogs.filter(l => !l.syncedAt);

    for (const log of toSync) {
      const { error } = await supabase.from('habit_logs').upsert({
        id: log.id,
        habit_id: log.habitId,
        user_id: log.userId,
        date: log.date,
        completed: log.completed,
        count_value: log.countValue,
      }, { onConflict: 'id' });

      if (!error) {
        await db.update(habitLogsTable)
          .set({ syncedAt: Date.now() })
          .where(eq(habitLogsTable.id, log.id));
      }
    }
  } catch (e) {
    console.warn('Habit sync failed:', e);
  }
}
