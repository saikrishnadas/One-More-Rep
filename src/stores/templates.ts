import { create } from 'zustand';
import { db } from '@/db/client';
import { workoutTemplates, templateExercises } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export interface TemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  targetReps: number;
  targetWeightKg: number;
  orderIndex: number;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  exerciseCount: number;
  createdAt: Date;
  exercises?: TemplateExercise[];
}

interface TemplatesState {
  templates: WorkoutTemplate[];
  loading: boolean;
  loadTemplates: (userId: string) => Promise<void>;
  loadTemplateExercises: (templateId: string) => Promise<TemplateExercise[]>;
  saveTemplate: (
    userId: string,
    name: string,
    exercises: { exerciseId: string; exerciseName: string; sets: number; targetReps: number; targetWeightKg: number }[]
  ) => Promise<string>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  templates: [],
  loading: false,

  loadTemplates: async (userId) => {
    set({ loading: true });
    try {
      const rows = await db.select().from(workoutTemplates)
        .where(eq(workoutTemplates.userId, userId))
        .orderBy(desc(workoutTemplates.createdAt));
      set({ templates: rows as WorkoutTemplate[] });
    } finally {
      set({ loading: false });
    }
  },

  loadTemplateExercises: async (templateId) => {
    const rows = await db.select().from(templateExercises)
      .where(eq(templateExercises.templateId, templateId));
    return rows.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) as TemplateExercise[];
  },

  saveTemplate: async (userId, name, exercises) => {
    const id = generateId();
    await db.insert(workoutTemplates).values({
      id,
      userId,
      name,
      description: null,
      exerciseCount: exercises.length,
      createdAt: new Date(),
    });

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await db.insert(templateExercises).values({
        id: generateId(),
        templateId: id,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets,
        targetReps: ex.targetReps,
        targetWeightKg: ex.targetWeightKg,
        orderIndex: i,
      });
    }

    await get().loadTemplates(userId);
    return id;
  },

  deleteTemplate: async (id) => {
    await db.delete(templateExercises).where(eq(templateExercises.templateId, id));
    await db.delete(workoutTemplates).where(eq(workoutTemplates.id, id));
    set(s => ({ templates: s.templates.filter(t => t.id !== id) }));
  },
}));
