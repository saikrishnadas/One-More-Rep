import { create } from 'zustand';
import { db } from '@/db/client';
import { mealTemplates } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export interface MealTemplate {
  id: string;
  userId: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  mealType: string | null;
  usageCount: number;
}

interface MealTemplatesState {
  templates: MealTemplate[];
  loading: boolean;
  load: (userId: string) => Promise<void>;
  save: (userId: string, template: Omit<MealTemplate, 'id' | 'userId' | 'usageCount'>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  incrementUsage: (id: string) => Promise<void>;
}

export const useMealTemplatesStore = create<MealTemplatesState>((set, get) => ({
  templates: [],
  loading: false,

  load: async (userId) => {
    set({ loading: true });
    try {
      const rows = await db.select().from(mealTemplates)
        .where(eq(mealTemplates.userId, userId))
        .orderBy(desc(mealTemplates.usageCount));
      set({ templates: rows as MealTemplate[] });
    } finally {
      set({ loading: false });
    }
  },

  save: async (userId, template) => {
    const id = generateId();
    const entry = { id, userId, ...template, usageCount: 0 };
    await db.insert(mealTemplates).values(entry as any);
    set(s => ({ templates: [entry, ...s.templates] }));
  },

  deleteTemplate: async (id) => {
    await db.delete(mealTemplates).where(eq(mealTemplates.id, id));
    set(s => ({ templates: s.templates.filter(t => t.id !== id) }));
  },

  incrementUsage: async (id) => {
    const template = get().templates.find(t => t.id === id);
    if (!template) return;
    const newCount = template.usageCount + 1;
    await db.update(mealTemplates)
      .set({ usageCount: newCount })
      .where(eq(mealTemplates.id, id));
    set(s => ({
      templates: s.templates.map(t => t.id === id ? { ...t, usageCount: newCount } : t),
    }));
  },
}));
