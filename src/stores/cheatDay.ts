import { create } from 'zustand';
import { db } from '@/db/client';
import { cheatDayLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateId, formatDate } from '@/lib/utils';

interface CheatDayLog {
  id: string;
  userId: string;
  date: string;
  notes: string | null;
  plannedVsActual: string;
  guilt: number;
}

interface CheatDayStore {
  logs: CheatDayLog[];
  load: (userId: string) => Promise<void>;
  logCheatDay: (userId: string, data: { notes?: string; plannedVsActual: string; guilt: number }) => Promise<void>;
  isCheatDay: (date: string) => boolean;
  suggestBestDay: (trainingDaysPerWeek: number) => string;
}

export const useCheatDayStore = create<CheatDayStore>((set, get) => ({
  logs: [],
  load: async (userId) => {
    const rows = await db.select().from(cheatDayLogs).where(eq(cheatDayLogs.userId, userId));
    set({ logs: rows as CheatDayLog[] });
  },
  logCheatDay: async (userId, data) => {
    const entry: CheatDayLog = {
      id: generateId(),
      userId,
      date: formatDate(new Date()),
      notes: data.notes ?? null,
      plannedVsActual: data.plannedVsActual,
      guilt: data.guilt,
    };
    await db.insert(cheatDayLogs).values(entry);
    set(s => ({ logs: [...s.logs, entry] }));
  },
  isCheatDay: (date) => get().logs.some(l => l.date === date),
  suggestBestDay: (trainingDaysPerWeek) => {
    const suggestions: Record<number, string> = {
      3: 'Sunday', 4: 'Saturday', 5: 'Saturday', 6: 'Sunday',
    };
    return suggestions[trainingDaysPerWeek] ?? 'Saturday';
  },
}));
