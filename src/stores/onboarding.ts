import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Goal = 'lose_weight' | 'build_muscle' | 'improve_fitness' | 'powerlifting' | 'stay_active';
export type Gender = 'male' | 'female' | 'other';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type DietType = 'any' | 'veg' | 'vegan' | 'keto' | 'non_veg';

export interface OnboardingData {
  // step: basics
  age: string;
  gender: Gender | null;
  // step: body
  weightKg: string;
  heightCm: string;
  bodyFatPct: string;
  targetWeightKg: string;
  // step: fitness
  fitnessLevel: FitnessLevel | null;
  // step: goal
  goal: Goal | null;
  // step: schedule
  trainingDaysPerWeek: number;
  sessionDurationMins: number;
  // step: muscles
  strongMuscles: string[];
  weakMuscles: string[];
  // step: equipment
  availableEquipment: string[];
  // step: injuries
  injuries: string;
  // step: diet
  dietType: DietType;
}

interface OnboardingState {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  toggleMuscle: (field: 'strongMuscles' | 'weakMuscles', muscle: string) => void;
  toggleEquipment: (item: string) => void;
  save: (userId: string) => Promise<void>;
  load: (userId: string) => Promise<void>;
}

const DEFAULT: OnboardingData = {
  age: '', gender: null, weightKg: '', heightCm: '', bodyFatPct: '', targetWeightKg: '',
  fitnessLevel: null, goal: null, trainingDaysPerWeek: 4, sessionDurationMins: 60,
  strongMuscles: [], weakMuscles: [], availableEquipment: [],
  injuries: '', dietType: 'any',
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  data: DEFAULT,

  update: (patch) => set(s => ({ data: { ...s.data, ...patch } })),

  toggleMuscle: (field, muscle) => set(s => {
    const arr = s.data[field];
    return { data: { ...s.data, [field]: arr.includes(muscle) ? arr.filter(m => m !== muscle) : [...arr, muscle] } };
  }),

  toggleEquipment: (item) => set(s => {
    const arr = s.data.availableEquipment;
    return { data: { ...s.data, availableEquipment: arr.includes(item) ? arr.filter(e => e !== item) : [...arr, item] } };
  }),

  save: async (userId) => {
    const d = get().data;
    // Update profiles table
    await supabase.from('profiles').update({
      bodyweight_kg: d.weightKg ? parseFloat(d.weightKg) : null,
      goal: d.goal,
      training_days_per_week: d.trainingDaysPerWeek,
    }).eq('id', userId);

    // Upsert onboarding table
    await supabase.from('user_onboarding').upsert({
      id: userId,
      age: d.age ? parseInt(d.age) : null,
      gender: d.gender,
      height_cm: d.heightCm ? parseFloat(d.heightCm) : null,
      fitness_level: d.fitnessLevel,
      session_duration_mins: d.sessionDurationMins,
      strong_muscles: d.strongMuscles,
      weak_muscles: d.weakMuscles,
      available_equipment: d.availableEquipment,
      injuries: d.injuries || null,
      diet_type: d.dietType,
      body_fat_pct: d.bodyFatPct ? parseFloat(d.bodyFatPct) : null,
      target_weight_kg: d.targetWeightKg ? parseFloat(d.targetWeightKg) : null,
    }, { onConflict: 'id' });
  },

  load: async (userId) => {
    const { data } = await supabase.from('user_onboarding').select('*').eq('id', userId).single();
    if (!data) return;
    set({
      data: {
        age: String(data.age ?? ''),
        gender: data.gender ?? null,
        weightKg: '',
        heightCm: String(data.height_cm ?? ''),
        bodyFatPct: String(data.body_fat_pct ?? ''),
        targetWeightKg: String(data.target_weight_kg ?? ''),
        fitnessLevel: data.fitness_level ?? null,
        goal: null,
        trainingDaysPerWeek: 4,
        sessionDurationMins: data.session_duration_mins ?? 60,
        strongMuscles: data.strong_muscles ?? [],
        weakMuscles: data.weak_muscles ?? [],
        availableEquipment: data.available_equipment ?? [],
        injuries: data.injuries ?? '',
        dietType: data.diet_type ?? 'any',
      }
    });
  },
}));
