import { create } from 'zustand';
import { db } from '@/db/client';
import { habits as habitsTable, habitLogs as habitLogsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId, formatDate } from '@/lib/utils';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  habitType: 'boolean' | 'count';
  targetCount: number;
  reminderTime: string | null;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  countValue: number;
}

interface HabitState {
  habits: Habit[];
  logs: HabitLog[]; // logs for today + last 90 days
  loading: boolean;
  loadHabits: (userId: string) => Promise<void>;
  loadLogs: (userId: string) => Promise<void>;
  createHabit: (userId: string, data: Omit<Habit, 'id' | 'userId'>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabit: (userId: string, habitId: string, date: string) => Promise<void>;
  setCount: (userId: string, habitId: string, date: string, count: number) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  logs: [],
  loading: false,

  loadHabits: async (userId) => {
    const rows = await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
    set({ habits: rows as Habit[] });
  },

  loadLogs: async (userId) => {
    // Load last 90 days of logs
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const minDate = formatDate(ninetyDaysAgo);
    const rows = await db.select().from(habitLogsTable)
      .where(eq(habitLogsTable.userId, userId));
    // Filter by date >= minDate in JS (simpler than SQL for this)
    const filtered = (rows as HabitLog[]).filter(r => r.date >= minDate);
    set({ logs: filtered });
  },

  createHabit: async (userId, data) => {
    const id = generateId();
    const habit: Habit = { id, userId, ...data };
    await db.insert(habitsTable).values({
      id,
      userId,
      name: data.name,
      icon: data.icon,
      habitType: data.habitType,
      targetCount: data.targetCount,
      reminderTime: data.reminderTime,
    });
    set(s => ({ habits: [...s.habits, habit] }));
  },

  deleteHabit: async (id) => {
    await db.delete(habitsTable).where(eq(habitsTable.id, id));
    // Also delete logs
    await db.delete(habitLogsTable).where(eq(habitLogsTable.habitId, id));
    set(s => ({
      habits: s.habits.filter(h => h.id !== id),
      logs: s.logs.filter(l => l.habitId !== id),
    }));
  },

  toggleHabit: async (userId, habitId, date) => {
    const { logs } = get();
    const existing = logs.find(l => l.habitId === habitId && l.date === date);
    if (existing) {
      const newCompleted = !existing.completed;
      await db.update(habitLogsTable)
        .set({ completed: newCompleted ? 1 : 0 })
        .where(eq(habitLogsTable.id, existing.id));
      set(s => ({
        logs: s.logs.map(l => l.id === existing.id ? { ...l, completed: newCompleted } : l),
      }));
    } else {
      const id = generateId();
      const newLog: HabitLog = { id, habitId, userId, date, completed: true, countValue: 0 };
      await db.insert(habitLogsTable).values({ id, habitId, userId, date, completed: 1, countValue: 0 });
      set(s => ({ logs: [...s.logs, newLog] }));
    }
  },

  setCount: async (userId, habitId, date, count) => {
    const { logs } = get();
    const existing = logs.find(l => l.habitId === habitId && l.date === date);
    const completed = count > 0;
    if (existing) {
      await db.update(habitLogsTable)
        .set({ countValue: count, completed: completed ? 1 : 0 })
        .where(eq(habitLogsTable.id, existing.id));
      set(s => ({
        logs: s.logs.map(l => l.id === existing.id ? { ...l, countValue: count, completed } : l),
      }));
    } else {
      const id = generateId();
      await db.insert(habitLogsTable).values({ id, habitId, userId, date, completed: completed ? 1 : 0, countValue: count });
      set(s => ({ logs: [...s.logs, { id, habitId, userId, date, completed, countValue: count }] }));
    }
  },
}));
