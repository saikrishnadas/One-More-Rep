import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const CLAUDE_MODEL = 'claude-sonnet-4-5';

interface WorkoutSummary {
  totalWorkouts: number;
  weeklyWorkouts: number;
  recentMuscles: string[]; // muscles worked in last 7 days
  totalVolumeKg: number;
  topExercises: string[];
  currentStreak: number;
}

interface NutritionSummary {
  avgCalories: number;
  avgProteinG: number;
  daysLogged: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ suggestion: 'Keep pushing! Consistency beats perfection.', targetMuscle: 'full body' }),
      { status: 200, headers: corsHeaders }
    );
  }

  try {
    const { workout, nutrition, goal, profile } = await req.json() as {
      workout: WorkoutSummary;
      nutrition: NutritionSummary;
      goal: string | null;
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
      };
    };

    const systemPrompt = `You are an elite personal trainer AI inside the Gym Buddy fitness app.
You analyze workout and nutrition data to give personalized, motivating advice.
Keep responses concise (2-4 sentences max). Be direct, energetic, and specific.
Always end with one concrete actionable recommendation.`;

    const allMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'glutes'];
    const untrained = allMuscles.filter(m => !workout.recentMuscles.includes(m));

    const profileContext = profile ? `
User profile:
- Age: ${profile.age ?? 'unknown'}, Gender: ${profile.gender ?? 'unknown'}
- Fitness level: ${profile.fitnessLevel ?? 'unknown'}
- BMI: ${profile.bmi ? profile.bmi.toFixed(1) : 'unknown'}
- Strong muscles: ${profile.strongMuscles?.join(', ') || 'not specified'}
- Weak muscles (needs work): ${profile.weakMuscles?.join(', ') || 'not specified'}
- Available equipment: ${profile.availableEquipment?.join(', ') || 'not specified'}
- Injuries/limitations: ${profile.injuries || 'none'}
- Diet: ${profile.dietType ?? 'any'}
- Preferred session length: ${profile.sessionDurationMins ?? 60} min` : '';

    const userMessage = `${profileContext}

Workout data:
- Goal: ${goal ?? 'general fitness'}
- Total workouts: ${workout.totalWorkouts} (${workout.weeklyWorkouts} this week)
- Recent muscles trained: ${workout.recentMuscles.join(', ') || 'none this week'}
- Untrained muscles this week: ${untrained.join(', ') || 'all covered'}
- Weekly volume: ${Math.round(workout.totalVolumeKg)} kg
- Nutrition: avg ${Math.round(nutrition.avgCalories)} kcal/day, ${Math.round(nutrition.avgProteinG)}g protein (${nutrition.daysLogged}/7 days logged)

Give a brief personalized training suggestion for today, taking into account the user's weak muscles, equipment, and injuries.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    const suggestion = data.content?.[0]?.text ?? 'Keep pushing! Consistency beats perfection.';
    const targetMuscle = untrained[0] ?? workout.recentMuscles[workout.recentMuscles.length - 1] ?? 'full body';

    return new Response(JSON.stringify({ suggestion, targetMuscle }), { headers: corsHeaders });
  } catch (e) {
    console.error('ai-trainer-suggest error:', e);
    return new Response(
      JSON.stringify({ suggestion: 'Keep pushing! Consistency beats perfection.', targetMuscle: 'full body' }),
      { status: 200, headers: corsHeaders }
    );
  }
});
