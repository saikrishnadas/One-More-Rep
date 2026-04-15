import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
// Try newest model first, fall back to stable release
const CLAUDE_MODEL = 'claude-sonnet-4-5';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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

  // Guard: API key must be set
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ reply: null, error: 'ANTHROPIC_API_KEY is not set. Add it via: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...' }),
      { status: 200, headers: corsHeaders }
    );
  }

  try {
    const { messages, context, systemOverride, maxTokens } = await req.json() as {
      messages: ChatMessage[];
      systemOverride?: string;
      maxTokens?: number;
      context: {
        username: string;
        goal: string | null;
        level: number;
        weeklyWorkouts: number;
        totalVolumeKg: number;
        recentMuscles: string[];
      };
    };

    // systemOverride lets callers (e.g. workout plan generator) bypass the chat word limit
    const systemPrompt = systemOverride ?? `You are an elite personal trainer AI named "Coach" inside the Voltrep fitness app.
You're talking to ${context.username}, a Level ${context.level} athlete with goal: ${context.goal ?? 'general fitness'}.
Recent stats: ${context.weeklyWorkouts} workouts this week, ${Math.round(context.totalVolumeKg)} kg volume, muscles trained: ${context.recentMuscles.join(', ') || 'none yet'}.

Be motivating, knowledgeable, and concise. Give specific, actionable advice.
Answer fitness questions, suggest exercises, help with nutrition, and provide motivation.
Keep responses under 150 words unless explaining a complex exercise technique.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens ?? 512,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return new Response(
        JSON.stringify({ reply: null, error: `Anthropic API returned ${response.status}: ${errBody}` }),
        { status: 200, headers: corsHeaders }
      );
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? "I'm having trouble connecting right now. Try again!";

    return new Response(JSON.stringify({ reply }), { headers: corsHeaders });
  } catch (e) {
    console.error('Edge function error:', e);
    return new Response(
      JSON.stringify({ reply: null, error: String(e) }),
      { status: 200, headers: corsHeaders }
    );
  }
});
