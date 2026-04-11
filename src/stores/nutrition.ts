import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import { db } from '@/db/client';
import { nutritionLogs, nutritionGoals } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';
import { syncNutritionLogs } from '@/lib/nutrition-sync';

export interface NutritionEntry {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  source: string;
}

export interface NutritionGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface NutritionState {
  entries: NutritionEntry[];
  goals: NutritionGoals;
  selectedDate: string;
  isLoading: boolean;

  loadDay: (userId: string, date?: string) => Promise<void>;
  loadGoals: (userId: string) => Promise<void>;
  addEntry: (userId: string, entry: Omit<NutritionEntry, 'id' | 'userId' | 'date'>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  saveGoals: (userId: string, goals: NutritionGoals) => Promise<void>;
  setSelectedDate: (date: string) => void;
}

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2200,
  proteinG: 180,
  carbsG: 250,
  fatG: 70,
};

export const useNutritionStore = create<NutritionState>((set, get) => ({
  entries: [],
  goals: DEFAULT_GOALS,
  selectedDate: formatDate(new Date()),
  isLoading: false,

  loadDay: async (userId, date) => {
    const targetDate = date ?? get().selectedDate;
    set({ isLoading: true });
    const rows = await db
      .select()
      .from(nutritionLogs)
      .where(and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, targetDate)));
    set({
      entries: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        date: r.date,
        mealType: r.mealType as NutritionEntry['mealType'],
        foodName: r.foodName,
        calories: r.calories ?? 0,
        proteinG: r.proteinG ?? 0,
        carbsG: r.carbsG ?? 0,
        fatG: r.fatG ?? 0,
        fiberG: r.fiberG ?? 0,
        source: r.source ?? 'manual',
      })),
      isLoading: false,
    });
  },

  loadGoals: async (userId) => {
    const [row] = await db
      .select()
      .from(nutritionGoals)
      .where(eq(nutritionGoals.userId, userId));
    if (row) {
      set({
        goals: {
          calories: row.calories ?? DEFAULT_GOALS.calories,
          proteinG: row.proteinG ?? DEFAULT_GOALS.proteinG,
          carbsG: row.carbsG ?? DEFAULT_GOALS.carbsG,
          fatG: row.fatG ?? DEFAULT_GOALS.fatG,
        },
      });
    }
  },

  addEntry: async (userId, entry) => {
    const id = randomUUID();
    const date = get().selectedDate;
    await db.insert(nutritionLogs).values({
      id,
      userId,
      date,
      mealType: entry.mealType,
      foodName: entry.foodName,
      calories: entry.calories,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
      fiberG: entry.fiberG,
      source: entry.source,
    });
    set({
      entries: [
        ...get().entries,
        { id, userId, date, ...entry },
      ],
    });
    // Sync in background
    syncNutritionLogs(userId, date).catch(console.warn);
  },

  removeEntry: async (id) => {
    await db.delete(nutritionLogs).where(eq(nutritionLogs.id, id));
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },

  saveGoals: async (userId, goals) => {
    // Upsert: delete then insert (SQLite doesn't support ON CONFLICT easily with Drizzle)
    await db.delete(nutritionGoals).where(eq(nutritionGoals.userId, userId));
    await db.insert(nutritionGoals).values({
      id: randomUUID(),
      userId,
      calories: goals.calories,
      proteinG: goals.proteinG,
      carbsG: goals.carbsG,
      fatG: goals.fatG,
    });
    set({ goals });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
}));
