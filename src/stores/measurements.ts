import { create } from 'zustand';
import { db } from '@/db/client';
import { bodyMeasurements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateId, formatDate } from '@/lib/utils';

export interface MeasurementEntry {
  id: string;
  userId: string;
  date: string;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  armsCm: number | null;
  thighsCm: number | null;
  neckCm: number | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  notes: string | null;
}

interface MeasurementsState {
  history: MeasurementEntry[];
  loading: boolean;
  latestEntry: MeasurementEntry | null;
  loadHistory: (userId: string) => Promise<void>;
  addEntry: (userId: string, data: Omit<MeasurementEntry, 'id' | 'userId' | 'date'>) => Promise<void>;
}

export const useMeasurementsStore = create<MeasurementsState>((set, get) => ({
  history: [],
  loading: false,
  latestEntry: null,

  loadHistory: async (userId) => {
    set({ loading: true });
    try {
      const rows = await db.select().from(bodyMeasurements)
        .where(eq(bodyMeasurements.userId, userId))
        .orderBy(desc(bodyMeasurements.date))
        .limit(365);
      const history = rows as MeasurementEntry[];
      set({ history, latestEntry: history[0] ?? null });
    } finally {
      set({ loading: false });
    }
  },

  addEntry: async (userId, data) => {
    const entry: MeasurementEntry = {
      id: generateId(),
      userId,
      date: formatDate(new Date()),
      ...data,
    };
    await db.insert(bodyMeasurements).values(entry as any);
    set(s => ({ history: [entry, ...s.history], latestEntry: entry }));
  },
}));
