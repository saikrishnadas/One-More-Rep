# Pro Health Features Batch 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 4 PRO-gated health features: Workout Intensity Score, Readiness-Adjusted 1RM, Health-Enhanced Muscle Recovery, and Best Training Window.

**Architecture:** Pure computation features over existing health data (HealthKit/Health Connect) and workout DB. No new native modules or permissions. Each feature is a small lib function + UI component. All features are PRO-gated: free users see feature name + lock icon + description of what PRO unlocks.

**Tech Stack:** React Native (Expo SDK 54), Zustand stores, Drizzle ORM (SQLite), react-native-svg for charts, existing health-platform.ts wrapper.

**Note:** No test framework is configured in this project. Verification is manual via the running app.

---

## File Map

**New files:**
- `src/lib/intensity-score.ts` — intensity score calculation (0-100)
- `src/lib/training-window.ts` — best training time analysis
- `src/components/stats/IntensityChart.tsx` — intensity trend bar chart
- `src/components/home/TrainingWindowCard.tsx` — home screen card
- `src/components/stats/TrainingWindowChart.tsx` — detailed stats chart

**Modified files:**
- `src/db/schema.ts` — add `intensityScore` column
- `src/db/client.ts` — add ALTER TABLE migration
- `src/lib/progressive-overload.ts` — add readiness adjustment function
- `src/lib/muscle-recovery.ts` — add health-enhanced recovery adjustment
- `src/components/workout/ExerciseBlock.tsx` — readiness-adjusted suggestion chip + PRO lock
- `src/components/home/MuscleStatusCard.tsx` — PRO lock banner + watch note
- `app/workout-summary.tsx` — intensity score display
- `app/workout-stats.tsx` — intensity chart + training window chart
- `app/(tabs)/index.tsx` — training window card

---

## Task 1: Database — Add intensityScore Column

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/db/client.ts`

- [ ] **Step 1: Add column to Drizzle schema**

In `src/db/schema.ts`, add `intensityScore` to the `workoutSessions` table after the `caloriesBurned` column:

```typescript
  caloriesBurned: integer('calories_burned'),
  intensityScore: real('intensity_score'),
});
```

- [ ] **Step 2: Add ALTER TABLE migration**

In `src/db/client.ts`, inside `initDatabase()`, add after the existing `caloriesBurned` migration (look for the last `ALTER TABLE workout_sessions ADD COLUMN` block):

```typescript
    // Phase 11: intensity score
    try {
      await sqliteDb.execAsync('ALTER TABLE workout_sessions ADD COLUMN intensity_score REAL;');
    } catch {}
```

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts src/db/client.ts
git commit -m "feat: add intensityScore column to workoutSessions"
```

---

## Task 2: Intensity Score Calculation

**Files:**
- Create: `src/lib/intensity-score.ts`

- [ ] **Step 1: Create the intensity score calculation module**

Create `src/lib/intensity-score.ts`:

```typescript
import { type WorkoutHRData } from './health-platform';

const MAX_EXPECTED_DENSITY = 200; // kg/min — normalizing constant for heavy compound sessions

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface IntensityInput {
  totalVolumeKg: number;
  durationSeconds: number;
  setCount: number;
  avgRpe?: number | null;       // average RPE across all sets (1-10)
  hrData?: WorkoutHRData | null; // from getWorkoutHRData()
  userAge?: number | null;
}

export interface IntensityResult {
  score: number;          // 0-100
  label: 'Light' | 'Moderate' | 'Intense';
  color: string;          // hex color for UI
}

/**
 * Calculate a 0-100 workout intensity score.
 * Uses HR data when available (Pro + watch), falls back to volume/RPE metrics.
 */
export function calculateIntensityScore(input: IntensityInput): IntensityResult {
  const { totalVolumeKg, durationSeconds, setCount, avgRpe, hrData, userAge } = input;
  const durationMin = durationSeconds / 60;

  if (durationMin <= 0) return { score: 0, label: 'Light', color: '#22c55e' };

  const volumeDensity = totalVolumeKg / durationMin;
  let score: number;

  if (hrData && userAge && hrData.averageHR > 0) {
    // WITH HR data — volume (40) + HR effort (30) + zone time (30)
    const volumeScore = clamp((volumeDensity / MAX_EXPECTED_DENSITY) * 40, 0, 40);

    const maxHR = 220 - userAge;
    const avgHrPct = hrData.averageHR / maxHR;
    const hrScore = clamp(avgHrPct * 100 - 30, 0, 30);

    const z4z5Minutes = (hrData.zones.z4?.minutes ?? 0) + (hrData.zones.z5?.minutes ?? 0);
    const totalMinutes = durationMin;
    const z4z5Pct = totalMinutes > 0 ? z4z5Minutes / totalMinutes : 0;
    const zoneScore = clamp(z4z5Pct * 100, 0, 30);

    score = Math.round(volumeScore + hrScore + zoneScore);
  } else {
    // WITHOUT HR data — volume (50) + sets (25) + RPE (25)
    const volumeScore = clamp((volumeDensity / MAX_EXPECTED_DENSITY) * 50, 0, 50);
    const setScore = clamp((setCount / 30) * 25, 0, 25);
    const rpeScore = avgRpe ? clamp((avgRpe / 10) * 25, 0, 25) : 12; // default 12 if no RPE

    score = Math.round(volumeScore + setScore + rpeScore);
  }

  score = clamp(score, 0, 100);

  let label: IntensityResult['label'];
  let color: string;
  if (score < 40) {
    label = 'Light';
    color = '#22c55e'; // green
  } else if (score < 70) {
    label = 'Moderate';
    color = '#f59e0b'; // orange/warning
  } else {
    label = 'Intense';
    color = '#ef4444'; // red
  }

  return { score, label, color };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/intensity-score.ts
git commit -m "feat: add workout intensity score calculation (0-100)"
```

---

## Task 3: Display Intensity Score on Workout Summary

**Files:**
- Modify: `app/workout-summary.tsx`

- [ ] **Step 1: Import intensity score and subscription store**

At the top of `app/workout-summary.tsx`, add imports:

```typescript
import { calculateIntensityScore, type IntensityResult } from '@/lib/intensity-score';
import { useSubscriptionStore } from '@/stores/subscription';
```

- [ ] **Step 2: Compute intensity score in the component**

Inside the component, after existing state/effect declarations, add:

```typescript
  const { isPro } = useSubscriptionStore();

  const intensityResult: IntensityResult = useMemo(() => {
    const avgRpe = sessionRpe ?? null;
    return calculateIntensityScore({
      totalVolumeKg: volume,
      durationSeconds: duration,
      setCount: sets,
      avgRpe,
      hrData: hrData ?? null,
      userAge: 30, // TODO: read from profile
    });
  }, [volume, duration, sets, sessionRpe, hrData]);
```

Also add `useMemo` to the React import at the top if not already there.

- [ ] **Step 3: Save intensity score to DB**

In the existing `useEffect` that saves/syncs the workout session (look for where `caloriesBurned` or session data is saved), add after the calories logic:

```typescript
  // Save intensity score to DB
  useEffect(() => {
    if (sessionId && intensityResult.score > 0) {
      db.update(workoutSessions)
        .set({ intensityScore: intensityResult.score })
        .where(eq(workoutSessions.id, sessionId))
        .catch(() => {});
    }
  }, [sessionId, intensityResult.score]);
```

Make sure `db`, `workoutSessions`, and `eq` are imported from Drizzle.

- [ ] **Step 4: Add intensity score UI after the stats grid**

After the stats grid (`</View>` closing the `statsGrid`), add the intensity score card:

```tsx
        {/* Intensity Score */}
        <Card style={styles.intensityCard}>
          {isPro ? (
            <View style={styles.intensityContent}>
              <View style={[styles.intensityCircle, { borderColor: intensityResult.color }]}>
                <Text style={[styles.intensityNumber, { color: intensityResult.color }]}>
                  {intensityResult.score}
                </Text>
              </View>
              <View style={styles.intensityInfo}>
                <Text style={[styles.intensityLabel, { color: intensityResult.color }]}>
                  {intensityResult.label}
                </Text>
                <Text variant="caption">Workout Intensity Score</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.7}>
              <Text style={styles.intensityLockedTitle}>Intensity Score 🔒</Text>
              <Text style={styles.intensityLockedDesc}>PRO: See how hard each session was</Text>
            </TouchableOpacity>
          )}
        </Card>
```

- [ ] **Step 5: Add styles**

Add to the `StyleSheet.create` block:

```typescript
  intensityCard: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
  },
  intensityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  intensityCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityNumber: {
    fontSize: 28,
    fontWeight: '800' as any,
  },
  intensityInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  intensityLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700' as any,
  },
  intensityLockedTitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: '600' as any,
  },
  intensityLockedDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
```

- [ ] **Step 6: Commit**

```bash
git add app/workout-summary.tsx
git commit -m "feat: display intensity score on workout summary with PRO gate"
```

---

## Task 4: Intensity Trend Chart (Stats Screen)

**Files:**
- Create: `src/components/stats/IntensityChart.tsx`
- Modify: `app/workout-stats.tsx`

- [ ] **Step 1: Create IntensityChart component**

Create `src/components/stats/IntensityChart.tsx`. This is an SVG bar chart showing the last 20 sessions' intensity scores. Follow the same SVG pattern used by `VolumeChart.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Colors, Spacing, FontSize, Radius } from '@/lib/constants';
import { Text } from '@/components/ui/Text';

interface IntensityEntry {
  date: string;    // 'MM/DD'
  score: number;   // 0-100
  color: string;   // hex
}

interface IntensityChartProps {
  data: IntensityEntry[];
}

const CHART_HEIGHT = 160;
const BAR_GAP = 4;

function getBarColor(score: number): string {
  if (score < 40) return '#22c55e';
  if (score < 70) return '#f59e0b';
  return '#ef4444';
}

export function IntensityChart({ data }: IntensityChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="caption">Complete workouts to see intensity trends</Text>
      </View>
    );
  }

  const barWidth = Math.max(8, Math.min(24, (300 - data.length * BAR_GAP) / data.length));
  const chartWidth = data.length * (barWidth + BAR_GAP);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT + 24}>
        {/* Grid lines */}
        {[25, 50, 75].map((val) => (
          <Line
            key={val}
            x1={0}
            y1={CHART_HEIGHT - (val / 100) * CHART_HEIGHT}
            x2={chartWidth}
            y2={CHART_HEIGHT - (val / 100) * CHART_HEIGHT}
            stroke={Colors.textMuted + '30'}
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {data.map((entry, i) => {
          const barHeight = Math.max(2, (entry.score / 100) * CHART_HEIGHT);
          const x = i * (barWidth + BAR_GAP);
          const y = CHART_HEIGHT - barHeight;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                fill={getBarColor(entry.score)}
              />
              {/* Show date label for every 5th bar */}
              {i % 5 === 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT + 14}
                  fontSize={9}
                  fill={Colors.textMuted}
                  textAnchor="middle"
                >
                  {entry.date}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  empty: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
});
```

- [ ] **Step 2: Add IntensityChart to workout-stats screen**

In `app/workout-stats.tsx`, import the new component and subscription store:

```typescript
import { IntensityChart } from '@/components/stats/IntensityChart';
import { useSubscriptionStore } from '@/stores/subscription';
```

Add state for intensity data and load it from DB. After existing data loading logic:

```typescript
  const { isPro } = useSubscriptionStore();

  const intensityData = useMemo(() => {
    if (!sessions?.length) return [];
    return sessions
      .filter((s: any) => s.intensityScore != null)
      .slice(-20)
      .map((s: any) => ({
        date: new Date(s.startedAt).toLocaleDateString('en', { month: 'numeric', day: 'numeric' }),
        score: s.intensityScore,
        color: s.intensityScore < 40 ? '#22c55e' : s.intensityScore < 70 ? '#f59e0b' : '#ef4444',
      }));
  }, [sessions]);
```

Add the chart section after the PRs list card in the JSX. Find the section after the last `</Card>` before the 1RM Progress section:

```tsx
        {/* Intensity Trend */}
        <Card style={{ marginTop: Spacing.md, padding: Spacing.md }}>
          <Text variant="title" style={{ marginBottom: Spacing.sm }}>Intensity Trend</Text>
          {isPro ? (
            intensityData.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <IntensityChart data={intensityData} />
              </ScrollView>
            ) : (
              <Text variant="caption" style={{ padding: Spacing.md, textAlign: 'center' }}>
                Complete workouts to see intensity trends
              </Text>
            )
          ) : (
            <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.7}>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.md }}>
                Intensity Trend 🔒
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs }}>
                PRO: Track how hard your sessions are over time
              </Text>
            </TouchableOpacity>
          )}
        </Card>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/stats/IntensityChart.tsx app/workout-stats.tsx
git commit -m "feat: add intensity trend chart on stats screen with PRO gate"
```

---

## Task 5: Readiness-Adjusted 1RM

**Files:**
- Modify: `src/lib/progressive-overload.ts`
- Modify: `src/components/workout/ExerciseBlock.tsx`

- [ ] **Step 1: Add readiness adjustment function to progressive-overload.ts**

At the bottom of `src/lib/progressive-overload.ts`, add:

```typescript
/**
 * Adjust a progressive overload suggestion based on today's readiness score.
 * Factor: 0.85 at readiness 0, 1.0 at readiness 100.
 * Returns a new suggestion with adjusted weight, or the original if no readiness data.
 */
export function applyReadinessAdjustment(
  suggestion: OverloadSuggestion,
  readinessScore: number | null,
): OverloadSuggestion {
  if (readinessScore === null) return suggestion;

  const factor = 0.85 + 0.15 * (readinessScore / 100);
  const adjustedWeight = Math.round((suggestion.suggestedWeightKg * factor) / 2.5) * 2.5;

  return {
    ...suggestion,
    suggestedWeightKg: adjustedWeight,
    message: `Try ${adjustedWeight} kg \u00d7 ${suggestion.suggestedReps} (readiness ${readinessScore})`,
  };
}
```

- [ ] **Step 2: Update ExerciseBlock to use readiness-adjusted suggestions**

In `src/components/workout/ExerciseBlock.tsx`, add imports:

```typescript
import { applyReadinessAdjustment } from '@/lib/progressive-overload';
import { useHealthPlatformStore } from '@/stores/healthPlatform';
import { useSubscriptionStore } from '@/stores/subscription';
```

Inside the component, after the existing `suggestion` state/useEffect, add:

```typescript
  const readinessScore = useHealthPlatformStore((s) => s.readinessScore);
  const isPro = useSubscriptionStore((s) => s.isPro);

  // Apply readiness adjustment for Pro users
  const displaySuggestion = useMemo(() => {
    if (!suggestion) return null;
    if (isPro && readinessScore !== null) {
      return applyReadinessAdjustment(suggestion, readinessScore);
    }
    return suggestion;
  }, [suggestion, isPro, readinessScore]);
```

Add `useMemo` to the React import if not already present.

- [ ] **Step 3: Update the suggestion chip JSX**

Replace the existing suggestion chip JSX block:

```tsx
{suggestion && (
  <View style={styles.suggestionChip}>
    <Text style={styles.suggestionText}>
      {'\u{1F4A1}'} {displaySuggestion!.message}
      {displaySuggestion!.lastDate
        ? ` \u00b7 was ${displaySuggestion!.lastWeightKg}kg \u00d7 ${displaySuggestion!.lastReps} (${displaySuggestion!.lastDate})`
        : ''}
    </Text>
  </View>
)}
```

Then add the PRO lock hint below it for free users:

```tsx
{suggestion && !isPro && readinessScore !== null && (
  <TouchableOpacity
    style={styles.proHint}
    onPress={() => router.push('/paywall')}
    activeOpacity={0.7}
  >
    <Text style={styles.proHintText}>
      🔒 PRO: Adjust for your readiness ({readinessScore}/100)
    </Text>
  </TouchableOpacity>
)}
```

Add `router` import from `expo-router` if not already present.

- [ ] **Step 4: Add PRO hint styles**

Add to the StyleSheet in ExerciseBlock:

```typescript
  proHint: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  proHintText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/progressive-overload.ts src/components/workout/ExerciseBlock.tsx
git commit -m "feat: readiness-adjusted 1RM suggestions with PRO gate"
```

---

## Task 6: Health-Enhanced Muscle Recovery

**Files:**
- Modify: `src/lib/muscle-recovery.ts`
- Modify: `src/components/home/MuscleStatusCard.tsx`

- [ ] **Step 1: Add recovery adjustment functions to muscle-recovery.ts**

At the top of `src/lib/muscle-recovery.ts`, after existing imports, add:

```typescript
/**
 * Adjust recovery window based on health data (PRO feature).
 *
 * Full tier: uses readiness score (sleep + HRV + resting HR) for ±30% adjustment
 * Partial tier: uses last session RPE + volume ratio for ±15% adjustment
 * Returns the adjusted window in hours.
 */
export function adjustRecoveryWindow(
  baseHours: number,
  readinessScore: number | null,
  lastRpe: number | null,
  volumeRatio: number | null,
): number {
  // Full tier: readiness-based
  if (readinessScore !== null) {
    // Readiness 100 → 0.7x (30% faster), Readiness 0 → 1.3x (30% slower)
    const factor = 1.3 - 0.006 * readinessScore;
    return Math.round(baseHours * factor);
  }

  // Partial tier: RPE + volume based
  let rpeAdjust = 1.0;
  if (lastRpe !== null) {
    if (lastRpe >= 9) rpeAdjust = 1.15;
    else if (lastRpe <= 6) rpeAdjust = 0.90;
  }

  let volumeAdjust = 1.0;
  if (volumeRatio !== null) {
    if (volumeRatio >= 1.2) volumeAdjust = 1.10;
    else if (volumeRatio < 0.8) volumeAdjust = 0.95;
  }

  // Only apply if we have at least one signal
  if (lastRpe !== null || volumeRatio !== null) {
    return Math.round(baseHours * rpeAdjust * volumeAdjust);
  }

  return baseHours;
}
```

- [ ] **Step 2: Modify getMuscleRecovery to accept optional health context**

Update the `getMuscleRecovery` function signature to accept optional health data. Add a new parameter:

```typescript
export interface RecoveryContext {
  readinessScore: number | null;
  isPro: boolean;
}
```

Change the function signature:

```typescript
export async function getMuscleRecovery(
  userId: string,
  goal?: string | null,
  context?: RecoveryContext,
): Promise<Record<string, MuscleRecovery>>
```

Inside the function, where `recoveryWindowHours` is assigned (the line that calls `getRecoveryWindow(goal)`), replace the simple assignment with the adjusted version:

Find the line:
```typescript
const recoveryWindowHours = getRecoveryWindow(goal);
```

Replace with:
```typescript
const baseWindowHours = getRecoveryWindow(goal);
```

Then, inside the loop where each muscle's recovery is computed (where `trainedHoursAgo` and `recoveryPct` are calculated), adjust the window per-muscle. Find the block that computes `recoveryPct` and modify it:

Before the `recoveryPct` computation, add:
```typescript
        // For Pro users, look up last RPE and volume ratio for this muscle's last session
        let adjustedWindow = baseWindowHours;
        if (context?.isPro) {
          // Get RPE from the most recent set for this muscle
          const lastRpe = latestSets.length > 0 ? (latestSets[0] as any).rpe ?? null : null;

          // Compute volume ratio: this session volume vs. 4-week average
          // Simplified: use total session volume / average session volume
          const recentSessions = muscleLastTrained.get(muscle);
          const volumeRatio = null; // simplified — RPE alone provides good signal

          adjustedWindow = adjustRecoveryWindow(
            baseWindowHours,
            context.readinessScore,
            lastRpe,
            volumeRatio,
          );
        }
```

Then replace `recoveryWindowHours` with `adjustedWindow` in the `recoveryPct` and `readyInHours` calculations.

- [ ] **Step 3: Update callers to pass context**

In `src/components/home/MuscleStatusCard.tsx`, update the `getMuscleRecovery` call to pass the health context. Import the stores:

```typescript
import { useHealthPlatformStore } from '@/stores/healthPlatform';
import { useSubscriptionStore } from '@/stores/subscription';
```

Inside the component:

```typescript
  const readinessScore = useHealthPlatformStore((s) => s.readinessScore);
  const readinessData = useHealthPlatformStore((s) => s.readinessData);
  const isPro = useSubscriptionStore((s) => s.isPro);
```

Update the `getMuscleRecovery` call in the useEffect:

```typescript
  getMuscleRecovery(userId, goal, { readinessScore, isPro }).then(...)
```

- [ ] **Step 4: Add PRO lock banner and watch note to MuscleStatusCard**

After the horizontal `ScrollView` of muscle chips, add:

```tsx
        {/* PRO lock banner for free users */}
        {!isPro && (
          <TouchableOpacity
            style={proStyles.banner}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.7}
          >
            <Text style={proStyles.bannerText}>
              🔒 PRO: Smart recovery using your sleep & HRV data
            </Text>
          </TouchableOpacity>
        )}

        {/* Watch note for Pro users missing sleep data */}
        {isPro && readinessData && readinessData.sleepHours === null && (
          <Text style={proStyles.watchNote}>
            ⌚ Wear your watch to sleep for more accurate recovery data
          </Text>
        )}
```

Add the styles:

```typescript
const proStyles = StyleSheet.create({
  banner: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  bannerText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  watchNote: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
  },
});
```

Import `router` from `expo-router` and `StyleSheet` if not already imported.

- [ ] **Step 5: Update active-workout.tsx caller too**

In `app/active-workout.tsx`, find where `getMuscleRecovery` is called and add the context parameter:

```typescript
getMuscleRecovery(user.id, profile?.goal, {
  readinessScore: useHealthPlatformStore.getState().readinessScore,
  isPro: useSubscriptionStore.getState().isPro,
})
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/muscle-recovery.ts src/components/home/MuscleStatusCard.tsx app/active-workout.tsx
git commit -m "feat: health-enhanced muscle recovery with 3 tiers + PRO gate"
```

---

## Task 7: Training Window Analysis

**Files:**
- Create: `src/lib/training-window.ts`

- [ ] **Step 1: Create the training window analysis module**

Create `src/lib/training-window.ts`:

```typescript
import { getDatabase } from '../db/client';
import { workoutSessions } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface BracketData {
  name: 'Morning' | 'Afternoon' | 'Evening';
  range: string;          // e.g. '5 AM – 12 PM'
  sessionCount: number;
  avgScore: number;       // average intensity or volume density
  isBest: boolean;
}

export interface TrainingWindowResult {
  hasEnoughData: boolean;
  brackets: BracketData[];
  bestBracket: BracketData | null;
  advantage: number;       // percentage advantage over overall average
}

function getTimeBracket(hour: number): 'Morning' | 'Afternoon' | 'Evening' | null {
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour <= 22) return 'Evening';
  return null; // late night sessions excluded
}

/**
 * Analyze workout history to find the user's best training time of day.
 * Requires at least 10 sessions across 2+ time brackets.
 */
export async function analyzeTrainingWindows(userId: string): Promise<TrainingWindowResult> {
  const empty: TrainingWindowResult = {
    hasEnoughData: false,
    brackets: [],
    bestBracket: null,
    advantage: 0,
  };

  try {
    const db = getDatabase();
    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId));

    // Group sessions by time bracket
    const buckets: Record<string, { scores: number[]; count: number }> = {
      Morning: { scores: [], count: 0 },
      Afternoon: { scores: [], count: 0 },
      Evening: { scores: [], count: 0 },
    };

    for (const s of sessions) {
      if (!s.startedAt || !s.durationSeconds || s.durationSeconds <= 0) continue;

      const hour = new Date(s.startedAt).getHours();
      const bracket = getTimeBracket(hour);
      if (!bracket) continue;

      // Use intensityScore if available, otherwise fall back to volume density
      const score = s.intensityScore ??
        ((s.totalVolumeKg ?? 0) / (s.durationSeconds / 60));

      buckets[bracket].scores.push(score);
      buckets[bracket].count++;
    }

    // Check minimum data requirements
    const totalSessions = Object.values(buckets).reduce((sum, b) => sum + b.count, 0);
    const bracketsWithData = Object.values(buckets).filter((b) => b.count >= 2).length;

    if (totalSessions < 10 || bracketsWithData < 2) return empty;

    // Compute averages
    const bracketNames: Array<'Morning' | 'Afternoon' | 'Evening'> = ['Morning', 'Afternoon', 'Evening'];
    const ranges: Record<string, string> = {
      Morning: '5 AM – 12 PM',
      Afternoon: '12 – 5 PM',
      Evening: '5 – 10 PM',
    };

    const allScores = Object.values(buckets).flatMap((b) => b.scores);
    const overallAvg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

    const brackets: BracketData[] = bracketNames.map((name) => {
      const b = buckets[name];
      const avg = b.scores.length > 0 ? b.scores.reduce((a, c) => a + c, 0) / b.scores.length : 0;
      return {
        name,
        range: ranges[name],
        sessionCount: b.count,
        avgScore: Math.round(avg),
        isBest: false,
      };
    });

    // Find best bracket (only among those with 2+ sessions)
    const validBrackets = brackets.filter((b) => b.sessionCount >= 2);
    if (validBrackets.length < 2) return empty;

    const best = validBrackets.reduce((a, b) => (a.avgScore > b.avgScore ? a : b));
    best.isBest = true;

    const advantage = overallAvg > 0
      ? Math.round(((best.avgScore - overallAvg) / overallAvg) * 100)
      : 0;

    return {
      hasEnoughData: true,
      brackets,
      bestBracket: best,
      advantage: Math.max(0, advantage),
    };
  } catch {
    return empty;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/training-window.ts
git commit -m "feat: add training window analysis (best time of day)"
```

---

## Task 8: Training Window — Home Card

**Files:**
- Create: `src/components/home/TrainingWindowCard.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create TrainingWindowCard component**

Create `src/components/home/TrainingWindowCard.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useSubscriptionStore } from '@/stores/subscription';
import { analyzeTrainingWindows, type TrainingWindowResult } from '@/lib/training-window';
import { Colors, Spacing, FontSize, Radius } from '@/lib/constants';

interface Props {
  userId: string;
}

export function TrainingWindowCard({ userId }: Props) {
  const [result, setResult] = useState<TrainingWindowResult | null>(null);
  const isPro = useSubscriptionStore((s) => s.isPro);

  useEffect(() => {
    if (userId) {
      analyzeTrainingWindows(userId).then(setResult);
    }
  }, [userId]);

  if (!result) return null;

  // Free user — show locked card
  if (!isPro) {
    return (
      <Card style={styles.card}>
        <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.7}>
          <Text style={styles.title}>🕐 Best Training Window 🔒</Text>
          <Text style={styles.lockedDesc}>PRO: Discover when you're strongest</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  // Pro but not enough data
  if (!result.hasEnoughData) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>🕐 Best Training Window</Text>
        <Text variant="caption" style={{ marginTop: Spacing.xs }}>
          Keep training at different times — need 10+ sessions to analyze
        </Text>
      </Card>
    );
  }

  // Pro with data
  const maxScore = Math.max(...result.brackets.map((b) => b.avgScore), 1);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>🕐 Best Training Window</Text>

      <View style={styles.barsContainer}>
        {result.brackets.map((bracket) => (
          <View key={bracket.name} style={styles.barRow}>
            <Text style={styles.barLabel}>{bracket.name}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${(bracket.avgScore / maxScore) * 100}%` as any,
                    backgroundColor: bracket.isBest ? Colors.primary : Colors.textMuted,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barValue, bracket.isBest && { color: Colors.primary }]}>
              {bracket.avgScore}
            </Text>
            {bracket.isBest && (
              <Text style={styles.bestTag}>Best</Text>
            )}
          </View>
        ))}
      </View>

      {result.bestBracket && result.advantage > 0 && (
        <Text style={styles.insight}>
          You're {result.advantage}% stronger in the {result.bestBracket.name} ({result.bestBracket.range})
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700' as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  lockedDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  barsContainer: {
    gap: Spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barLabel: {
    width: 72,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.textMuted + '20',
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.sm,
  },
  barValue: {
    width: 28,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  bestTag: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600' as any,
  },
  insight: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
});
```

- [ ] **Step 2: Add TrainingWindowCard to home screen**

In `app/(tabs)/index.tsx`, import the component:

```typescript
import { TrainingWindowCard } from '@/components/home/TrainingWindowCard';
```

Place it after the `ReadinessCard` and before the `START WORKOUT` button:

```tsx
<ReadinessCard />

<TrainingWindowCard userId={user?.id ?? ''} />

<Button
  label="START WORKOUT"
  onPress={() => router.push('/active-workout')}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/home/TrainingWindowCard.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add training window card on home screen with PRO gate"
```

---

## Task 9: Training Window — Stats Chart

**Files:**
- Create: `src/components/stats/TrainingWindowChart.tsx`
- Modify: `app/workout-stats.tsx`

- [ ] **Step 1: Create detailed TrainingWindowChart**

Create `src/components/stats/TrainingWindowChart.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { analyzeTrainingWindows, type TrainingWindowResult } from '@/lib/training-window';
import { Colors, Spacing, FontSize } from '@/lib/constants';

interface Props {
  userId: string;
}

const BAR_WIDTH = 64;
const CHART_HEIGHT = 120;
const GAP = 24;

export function TrainingWindowChart({ userId }: Props) {
  const [result, setResult] = useState<TrainingWindowResult | null>(null);

  useEffect(() => {
    if (userId) {
      analyzeTrainingWindows(userId).then(setResult);
    }
  }, [userId]);

  if (!result || !result.hasEnoughData) {
    return (
      <View style={styles.empty}>
        <Text variant="caption">Need 10+ sessions across different times to analyze</Text>
      </View>
    );
  }

  const maxScore = Math.max(...result.brackets.map((b) => b.avgScore), 1);
  const chartWidth = result.brackets.length * (BAR_WIDTH + GAP);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT + 48}>
        {result.brackets.map((bracket, i) => {
          const barHeight = Math.max(4, (bracket.avgScore / maxScore) * CHART_HEIGHT);
          const x = i * (BAR_WIDTH + GAP);
          const y = CHART_HEIGHT - barHeight;
          const fillColor = bracket.isBest ? Colors.primary : Colors.textMuted + '80';

          return (
            <React.Fragment key={bracket.name}>
              <Rect x={x} y={y} width={BAR_WIDTH} height={barHeight} rx={4} fill={fillColor} />
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={y - 6}
                fontSize={14}
                fontWeight="bold"
                fill={bracket.isBest ? Colors.primary : Colors.textSecondary}
                textAnchor="middle"
              >
                {bracket.avgScore}
              </SvgText>
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 16}
                fontSize={12}
                fill={Colors.textSecondary}
                textAnchor="middle"
              >
                {bracket.name}
              </SvgText>
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 32}
                fontSize={10}
                fill={Colors.textMuted}
                textAnchor="middle"
              >
                {bracket.sessionCount} sessions
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {result.bestBracket && result.advantage > 0 && (
        <Text style={styles.insight}>
          You're {result.advantage}% stronger in the {result.bestBracket.name} ({result.bestBracket.range})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  empty: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  insight: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Add TrainingWindowChart to workout-stats screen**

In `app/workout-stats.tsx`, import:

```typescript
import { TrainingWindowChart } from '@/components/stats/TrainingWindowChart';
```

Add after the Intensity Trend card:

```tsx
        {/* Training Window */}
        <Card style={{ marginTop: Spacing.md, padding: Spacing.md }}>
          <Text variant="title" style={{ marginBottom: Spacing.sm }}>Best Training Window</Text>
          {isPro ? (
            <TrainingWindowChart userId={user?.id ?? ''} />
          ) : (
            <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.7}>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.md }}>
                Best Training Window 🔒
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs }}>
                PRO: Discover when you're strongest
              </Text>
            </TouchableOpacity>
          )}
        </Card>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/stats/TrainingWindowChart.tsx app/workout-stats.tsx
git commit -m "feat: add training window chart on stats screen with PRO gate"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Verify all features render without crashes**

Start Metro and open the app. Check each screen:

1. **Home screen** → TrainingWindowCard visible (locked or with data)
2. **Home screen** → MuscleStatusCard shows PRO lock banner (if free) or watch note (if Pro, no sleep)
3. **Start a workout** → ExerciseBlock shows suggestion chip with readiness adjustment (Pro) or 🔒 hint (free)
4. **Complete a workout** → Summary shows intensity score circle (Pro) or locked placeholder (free)
5. **Stats screen** → Intensity trend chart + Training window chart visible

- [ ] **Step 2: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: Pro health features batch 1 — intensity score, readiness 1RM, smart recovery, training window"
```
