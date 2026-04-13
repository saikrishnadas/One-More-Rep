import { supabase } from '@/lib/supabase';

export interface WorkoutSummary {
  totalWorkouts: number;
  weeklyWorkouts: number;
  recentMuscles: string[];
  totalVolumeKg: number;
  topExercises: string[];
  currentStreak: number;
}

export interface NutritionSummary {
  avgCalories: number;
  avgProteinG: number;
  daysLogged: number;
}

export interface AiSuggestion {
  suggestion: string;
  targetMuscle: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function fetchAiSuggestion(
  workout: WorkoutSummary,
  nutrition: NutritionSummary,
  goal: string | null,
  profile?: {
    fitnessLevel?: string;
    strongMuscles?: string[];
    weakMuscles?: string[];
    availableEquipment?: string[];
    injuries?: string;
    dietType?: string;
    age?: number;
    gender?: string;
    sessionDurationMins?: number;
    bmi?: number;
  }
): Promise<AiSuggestion> {
  const { data, error } = await supabase.functions.invoke('ai-trainer-suggest', {
    body: { workout, nutrition, goal, profile },
  });
  if (error) throw error;
  return data as AiSuggestion;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  context: {
    username: string;
    goal: string | null;
    level: number;
    weeklyWorkouts: number;
    totalVolumeKg: number;
    recentMuscles: string[];
    fitnessLevel?: string;
    strongMuscles?: string[];
    weakMuscles?: string[];
    availableEquipment?: string[];
    injuries?: string;
    dietType?: string;
    age?: number;
    gender?: string;
    sessionDurationMins?: number;
    bmi?: number;
  }
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-trainer-chat', {
    body: { messages, context },
  });

  // Supabase-level error (function not deployed, network down, etc.)
  if (error) {
    const msg = typeof error === 'object' && 'message' in error ? (error as any).message : String(error);
    throw new Error(msg);
  }

  // Function returned an error payload from Anthropic
  if (data?.error) {
    throw new Error(data.error);
  }

  return (data as { reply: string }).reply;
}
