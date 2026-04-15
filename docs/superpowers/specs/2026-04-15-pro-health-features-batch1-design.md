# Pro Health Features — Batch 1 Design Spec

**Date:** 2026-04-15
**Scope:** 4 features that use watch/health data to provide PRO-only insights

---

## Overview

Four computation-heavy features that turn raw health data (already being read via HealthKit / Health Connect) into actionable gym insights. All are PRO-gated. Free users see the feature name and what it does, but actual values are locked behind 🔒 with a clear description of what PRO unlocks.

---

## Feature 1: Readiness-Adjusted 1RM

### Purpose
Adjust the progressive overload weight suggestion based on today's readiness score. Users get a single, clear target weight that accounts for their recovery state.

### Formula
```
adjustmentFactor = 0.85 + (0.15 * readinessScore / 100)
effectiveWeight  = suggestedWeight * adjustmentFactor
// Round to nearest 2.5 kg
effectiveWeight  = Math.round(effectiveWeight / 2.5) * 2.5
```

| Readiness | Factor | Effect on 100kg suggestion |
|-----------|--------|---------------------------|
| 100       | 1.00   | 100 kg (no change)        |
| 80        | 0.97   | 97.5 kg                   |
| 50        | 0.925  | 92.5 kg                   |
| 20        | 0.88   | 87.5 kg                   |
| 0         | 0.85   | 85 kg                     |

### Data Dependencies
- `getSuggestion()` from `progressive-overload.ts` (existing)
- `readinessScore` from `healthPlatform` store (existing)
- `isPro` from `subscription` store (existing)

### Fallback
- No readiness score available → show original unadjusted suggestion (current behavior)
- Not Pro → show unadjusted suggestion + locked hint (see Pro Gating)

### File Changes
- **Modify:** `src/lib/progressive-overload.ts` — add `applyReadinessAdjustment(suggestion, readinessScore)` function
- **Modify:** `src/components/workout/ExerciseBlock.tsx` — pass readiness score, apply adjustment, show readiness indicator in chip

### UI
**Pro user with readiness:**
```
💡 Try 92.5 kg × 8 (readiness 62)
```

**Free user:**
```
💡 Try 100 kg × 8
🔒 PRO: Adjust for your readiness (62/100)
```
The 🔒 line is small, muted text below the main suggestion. Tapping it opens the Pro upgrade prompt.

---

## Feature 2: Health-Enhanced Muscle Recovery

### Purpose
Replace fixed recovery time windows (48h/72h) with dynamic estimates based on actual biometric data and workout intensity signals.

### Three Tiers

| Tier | Trigger | Data Source | Max Adjustment |
|------|---------|------------|----------------|
| Full | Pro + readiness score available | Sleep + HRV + Resting HR | ±30% |
| Partial | Pro + no readiness, but has RPE/volume | Last session RPE + volume vs. 4-week avg | ±15% |
| Basic | Free user OR no data | None | 0% (current fixed windows) |

### Formulas

**Full tier:**
```
adjustedWindow = baseWindow * (1.3 - 0.006 * readinessScore)
```
- Readiness 100 → baseWindow * 0.7 (30% faster)
- Readiness 50 → baseWindow * 1.0 (no change)
- Readiness 0 → baseWindow * 1.3 (30% slower)

**Partial tier — RPE adjustment:**
```
rpeAdjust:
  RPE >= 9  → 1.15 (15% slower recovery)
  RPE 7-8   → 1.0  (no change)
  RPE <= 6  → 0.90 (10% faster recovery)
```

**Partial tier — Volume adjustment:**
```
volumeRatio = lastSessionVolume / fourWeekAvgVolume
volumeAdjust:
  ratio >= 1.2 → 1.10 (10% slower — unusually heavy session)
  ratio 0.8-1.2 → 1.0  (no change)
  ratio < 0.8  → 0.95  (5% faster — light session)
```

**Combined partial:**
```
adjustedWindow = baseWindow * rpeAdjust * volumeAdjust
```

### Data Dependencies
- `readinessScore` from `healthPlatform` store (existing)
- `workoutSets.rpe` from DB (existing)
- `workoutSessions.totalVolumeKg` from DB (existing)
- `isPro` from `subscription` store (existing)

### File Changes
- **Modify:** `src/lib/muscle-recovery.ts` — add `adjustRecoveryWindow(baseHours, readinessScore, lastRpe, volumeRatio)` function; modify `getMuscleRecovery()` to accept optional readiness + recent RPE data
- **Modify:** `src/components/home/MuscleStatusCard.tsx` — add ⌚ note when sleep data missing; add 🔒 banner for free users

### UI

**Pro user, full data:**
Recovery chips show adjusted times. Below the card:
```
(no extra note — full data available)
```

**Pro user, no sleep data:**
Recovery chips show RPE/volume-adjusted times. Below the card:
```
⌚ Wear your watch to sleep for more accurate recovery data
```

**Free user:**
Recovery chips show basic fixed times. Banner overlay on the card:
```
🔒 PRO: Smart recovery using your sleep & HRV data
```
Tapping the banner opens Pro upgrade prompt.

---

## Feature 3: Workout Intensity Score

### Purpose
A single 0-100 number grading how hard each workout session was. Enables session-over-session comparison.

### Formula

**With HR data (Pro + watch connected):**
```
volumeDensity = totalVolumeKg / durationMinutes
volumeScore   = clamp(volumeDensity / maxExpectedDensity * 40, 0, 40)

avgHrPct      = avgHR / maxHR  (maxHR = 220 - age)
hrScore       = clamp(avgHrPct * 100 - 30, 0, 30)
// Maps: 30% maxHR → 0 pts, 60%+ maxHR → 30 pts

z4z5Pct       = timeInZ4andZ5 / totalDuration
zoneScore     = clamp(z4z5Pct * 100, 0, 30)

intensityScore = Math.round(volumeScore + hrScore + zoneScore)
```

`maxExpectedDensity` = 200 kg/min (normalizing constant — heavy compound session)

**Without HR data (fallback):**
```
volumeScore   = clamp(volumeDensity / maxExpectedDensity * 50, 0, 50)
setScore      = clamp(setCount / 30 * 25, 0, 25)  // 30 sets = full points
rpeScore      = clamp((avgRpe / 10) * 25, 0, 25)   // avgRpe across all sets

intensityScore = Math.round(volumeScore + setScore + rpeScore)
```

### Storage
- **Modify:** `src/db/schema.ts` — add `intensityScore integer` column to `workoutSessions` table
- **Modify:** `src/db/client.ts` — add column in CREATE TABLE (with ALTER TABLE fallback for existing DBs)

### File Changes
- **Create:** `src/lib/intensity-score.ts` — `calculateIntensityScore(session, hrData?, userAge?)` → number 0-100
- **Modify:** `app/workout-summary.tsx` — display intensity score circle after workout
- **Create:** `src/components/stats/IntensityChart.tsx` — trend chart for last 20 sessions (reuse VolumeChart SVG pattern)
- **Modify:** `app/workout-stats.tsx` — add intensity trend section

### UI — Workout Summary

**Pro user:**
Large circle with score number, color-coded:
- Green: 0-39 (Light)
- Orange: 40-69 (Moderate)
- Red: 70-100 (Intense)

Below the circle:
```
Intensity: 72 — Intense
14% harder than your avg push day
```

**Free user:**
Same circle position but score is replaced with 🔒:
```
Intensity Score 🔒
PRO: See how hard each session was
```

### UI — Stats Screen (History)
SVG bar chart showing last 20 sessions. X-axis = date, Y-axis = intensity score. Bars color-coded green/orange/red. Tapping a bar shows that session's details.

Free users see the chart area with 🔒 overlay.

---

## Feature 4: Best Training Window

### Purpose
Analyze workout history to find what time of day the user performs best. The "viral screenshot" feature.

### Analysis

**Time brackets:**
- Morning: 5:00 AM – 11:59 AM
- Afternoon: 12:00 PM – 4:59 PM
- Evening: 5:00 PM – 10:00 PM

**Per bracket, compute:**
```
avgIntensityScore = mean of intensityScore for sessions in bracket
avgVolumeDensity  = mean of (totalVolumeKg / durationMinutes)
sessionCount      = number of sessions in bracket
```

**Comparison:**
```
bestBracket = bracket with highest avgIntensityScore
advantage   = ((bestBracket.avg - overallAvg) / overallAvg * 100).toFixed(0)
```

**Minimum data:** 10 total sessions with at least 2 sessions in 2+ different brackets. Below this threshold, show "Not enough data yet — keep training at different times!"

### Data Dependencies
- `workoutSessions.startedAt` (timestamp — extract hour)
- `workoutSessions.intensityScore` (new column from Feature 3)
- `workoutSessions.totalVolumeKg`, `workoutSessions.durationSeconds` (existing)

**Note:** Feature 4 depends on Feature 3 (intensity score) being implemented first, since it uses `intensityScore` for comparison. For sessions recorded before Feature 3, fall back to `totalVolumeKg / durationMinutes` as the comparison metric.

### File Changes
- **Create:** `src/lib/training-window.ts` — `analyzeTrainingWindows(userId)` → `{ bestBracket, advantage, brackets[], hasEnoughData }`
- **Create:** `src/components/home/TrainingWindowCard.tsx` — compact home screen card with 3-bar mini chart
- **Create:** `src/components/stats/TrainingWindowChart.tsx` — detailed stats view with per-bracket breakdown
- **Modify:** `app/(tabs)/index.tsx` — add TrainingWindowCard below ReadinessCard
- **Modify:** `app/workout-stats.tsx` — add training window section

### UI — Home Card

**Pro user with enough data:**
```
┌─────────────────────────────────┐
│ 🕐 Best Training Window         │
│                                  │
│ Morning  ██░░░░░░  42           │
│ Afternoon████░░░░  58           │
│ Evening  ██████░░  71  ← Best   │
│                                  │
│ You're 12% stronger in the      │
│ Evening (5-8 PM)                │
└─────────────────────────────────┘
```

**Pro user, not enough data:**
```
🕐 Best Training Window
Keep training at different times — need 10+ sessions to analyze
```

**Free user:**
```
┌─────────────────────────────────┐
│ 🕐 Best Training Window 🔒      │
│                                  │
│ PRO: Discover when you're       │
│ strongest                        │
└─────────────────────────────────┘
```
Tapping opens Pro upgrade prompt.

---

## Pro Gating Pattern

All 4 features use the existing `useSubscriptionStore` (`isPro` boolean) and `<ProGate>` component.

### Free User Treatment (Consistent Across All Features)
Every locked feature shows:
1. **Feature name** — so the user knows it exists
2. **🔒 icon** — universal "this is Pro" signal
3. **One-line value description** — what they'd see if they upgraded
4. **Tap → Pro upgrade prompt** — existing `<ProGate>` bottom sheet

### Visual Style
- Locked text uses `Colors.textMuted` (#666666)
- 🔒 icon inline with the description
- The feature container/card is fully visible (not hidden), just the value is locked
- No blurring or heavy overlays — clean, minimal lock treatment

---

## Implementation Order

Features must be built in this order due to dependencies:

1. **Intensity Score** (Feature 3) — first, because Training Window depends on it
2. **Readiness-Adjusted 1RM** (Feature 1) — independent
3. **Health-Enhanced Muscle Recovery** (Feature 2) — independent
4. **Best Training Window** (Feature 4) — depends on Feature 3

Features 1, 2, and 3 can be built in parallel after Feature 3's `calculateIntensityScore` function is created.

---

## Verification Checklist

1. **Readiness-Adjusted 1RM:** Start workout with readiness 60 → suggestion shows adjusted weight (lower than normal) with "(readiness 60)" label. As free user → see normal suggestion + 🔒 PRO line below.
2. **Health-Enhanced Recovery:** Sleep 5 hours (low readiness) → chest recovery shows ~62h instead of 48h. No sleep data → RPE 9 from last session → chest shows ~55h. Free user → basic 48h + 🔒 banner.
3. **Intensity Score:** Complete a heavy workout → summary shows score 70+ in red. Complete a light workout → score 30 in green. Compare text shows % vs. average. Free user → 🔒 placeholder.
4. **Training Window:** Train 5 sessions morning, 5 evening with evening being heavier → home card shows "You're X% stronger in the Evening." Free user → locked card with "Discover when you're strongest."
