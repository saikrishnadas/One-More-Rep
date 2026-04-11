# Gym Buddy — Design Specification
**Date:** 2026-04-07
**Status:** Approved

---

## 1. Context

Gym Buddy is a mobile fitness app for iOS and Android that combines workout tracking, nutrition logging, habit discipline, gamification, social competition, and an AI personal trainer. The goal is to keep users engaged long-term through game mechanics, social accountability, and intelligent coaching — not just data logging.

The user wants everything in one place: track workouts with detailed muscle-group analytics, log food with macros, maintain personal discipline habits (sugar cut, no fap, etc.), see rich progress reports, compete with friends, and get AI-powered daily training suggestions.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Mobile | React Native + Expo (SDK 52+) | Cross-platform iOS + Android, fast dev, huge ecosystem |
| Navigation | Expo Router (file-based) | Clean tab + stack navigation, type-safe routes |
| State | Zustand + React Query | Zustand for local UI state; React Query for server data caching |
| Local DB | expo-sqlite via Drizzle ORM | Offline-first, fast local queries, syncs to Supabase |
| Backend DB | Supabase (PostgreSQL) | Managed Postgres, real-time, row-level security |
| Auth | Supabase Auth | Email/password + Google/Apple OAuth |
| File Storage | Supabase Storage | Profile photos, workout share cards |
| AI | Claude API via Supabase Edge Functions | AI trainer recommendations, chat, food recognition |
| Push Notifications | Expo Notifications + Supabase Edge Functions | Habit reminders, streak alerts, friend activity |
| Analytics | PostHog (self-hosted or cloud) | Track feature usage, retention |

---

## 3. Visual Design System

**Theme:** Fire / Ignite
**Background:** `#0d0d0d` (near-black)
**Primary accent:** `#f97316` (orange)
**Secondary accent:** `#ef4444` (red)
**Gradient:** `linear-gradient(90deg, #f97316, #ef4444)`
**Cards:** `#1a1a1a` with `#2a2a2a` borders
**Text primary:** `#f1f1f1`
**Text secondary:** `#9ca3af`
**Highlight borders:** `#f9731640` (accent with 25% opacity)
**Streak fire:** animated gradient + glow effect on active streaks
**Font:** System font (SF Pro on iOS, Roboto on Android) — clean and fast

---

## 4. App Architecture

### 4.1 Navigation Structure

```
App (Expo Router)
├── (auth)
│   ├── login.tsx
│   ├── signup.tsx
│   └── onboarding.tsx          # Goals, bodyweight, training days
├── (tabs)
│   ├── index.tsx               # Home / Dashboard
│   ├── workout.tsx             # Workout history + start workout
│   ├── nutrition.tsx           # Nutrition log
│   ├── social.tsx              # Friends + Leaderboard
│   └── profile.tsx             # Profile, Stats, Habits, Badges
└── (modals)
    ├── active-workout.tsx      # Full-screen active workout session
    ├── exercise-search.tsx     # Exercise picker modal
    ├── workout-summary.tsx     # Post-workout summary
    ├── log-meal.tsx            # Meal logging modal
    └── ai-trainer.tsx          # AI trainer chat + plan
```

### 4.2 Offline-First Data Flow

1. All writes go to local SQLite first (instant UI response)
2. Background sync pushes to Supabase
3. Real-time subscription pulls friend activity
4. On conflict: last-write-wins for personal data; append-only for social (reactions, comments)

### 4.3 Supabase Edge Functions

| Function | Purpose |
|---|---|
| `ai-trainer-suggest` | Claude API: analyze history, return daily workout plan |
| `ai-trainer-chat` | Claude API: conversational personal trainer |
| `ai-food-recognize` | Claude API: image → macro estimation |
| `send-habit-reminder` | Push notification for habit check-ins (cron) |
| `streak-alert` | "You're about to lose your streak!" notification |
| `generate-share-card` | Render workout summary as shareable PNG |
| `leaderboard-refresh` | Compute weekly leaderboard (cron, every hour) |

---

## 5. Feature Specifications

### 5.1 Workout Tracker

**Start Workout Flow:**
1. Tap "Start Workout" → creates a `workout_session` record with `started_at`
2. Active Workout screen (full-screen modal) shows:
   - Live duration timer
   - Real-time volume counter (kg × reps, summed)
   - Set count
   - List of exercises added so far
3. **Add Exercise:**
   - Search bar (fuzzy search by name)
   - Filter chips: muscle group (Chest, Back, Legs, Shoulders, Arms, Core), equipment (Barbell, Dumbbell, Cable, Machine, Bodyweight)
   - Exercise card shows: name, primary muscle, sub-muscle, equipment icon
   - Tap to add to session
4. **Per Exercise:**
   - Rows of sets: [Set #] [kg input] [reps input] [✓ check]
   - Previous session's weight/reps shown as placeholder
   - PR badge 🏆 appears if set beats all-time best
   - Rest timer auto-starts on set completion (configurable: 60s / 90s / 120s / off)
   - "+ Add Set" button
5. **End Workout:**
   - Calculates: total duration, total volume, sets, exercises
   - Maps exercises to muscle groups + sub-muscle groups
   - Awards XP based on volume + duration formula
   - Shows workout summary screen (confetti if PR hit)
   - Checks for badge unlocks
   - Syncs to Supabase

**Exercise Database:**
- ~400 exercises seeded locally
- Each exercise has: name, primary muscle group, sub-muscle groups (e.g., "Upper Pec", "Long Head Bicep"), equipment, instructions, demo image URL
- User can add custom exercises

**Muscle Groups & Sub-Groups:**

| Group | Sub-groups |
|---|---|
| Chest | Upper Pec, Mid Pec, Lower Pec |
| Back | Lats, Upper Back, Lower Back, Rhomboids, Traps |
| Shoulders | Front Delt, Side Delt, Rear Delt |
| Arms | Bicep (Long/Short Head), Tricep (Long/Lateral/Medial Head), Forearms |
| Legs | Quads, Hamstrings, Glutes, Calves, Hip Flexors |
| Core | Abs, Obliques, Lower Back |

---

### 5.2 Nutrition Tracker

**Daily Log:**
- Calorie ring (donut chart) showing consumed vs goal
- Macro bars: Protein (orange), Carbs (blue), Fats (purple)
- Fiber + Water tracking
- Meal sections: Breakfast, Lunch, Dinner, Snacks

**Add Food:**
- Barcode scanner (Expo Camera + Open Food Facts API)
- Search food database (USDA FoodData Central or Nutritionix)
- AI photo recognition: take photo → Claude estimates macros (marked as "AI estimate")
- Custom food entry
- Meal templates (save frequently eaten meals)

**Goals:**
- Set daily targets: calories, protein, carbs, fats
- Goal adjusts based on workout days (higher calories on training days)
- "You're 42g short on protein" nudge notification at 8pm if under goal

**Weekly Report:**
- Average daily macros vs goals
- Best day / worst day
- Protein goal hit streak
- Calorie surplus/deficit chart

---

### 5.3 Habit Tracker

**Create a Habit:**
- Name (e.g., "No Sugar", "No Fap", "Cold Shower", "8h Sleep", "10k Steps")
- Icon picker (emoji)
- Reminder time (optional push notification)
- Type: Yes/No (binary) or Count (e.g., "8 glasses water")

**Discipline Log View:**
- Per habit: GitHub contribution-style grid (last 90 days)
  - Empty = not logged
  - Orange fill = success
  - Dark orange = partial (for count habits)
  - Glowing orange = today if completed
- Streak counter with fire animation when ≥ 7 days
- Overall "Discipline Score" = % of habits completed today

**XP Integration:**
- Each habit completion = 10 XP
- Streak milestone bonuses: 7 days (+50 XP), 30 days (+200 XP), 100 days (+1000 XP)

**Notifications:**
- Daily reminder at user-set time
- "Streak at risk" alert if not checked in by 10pm

---

### 5.4 Gamification System

**XP & Levels:**

| Action | XP Earned |
|---|---|
| Complete a workout | 50 + (volume / 1000) XP |
| Hit a PR | +100 XP |
| Log all meals | 30 XP |
| Complete a habit | 10 XP |
| 7-day habit streak | +50 XP |
| 30-day habit streak | +200 XP |
| Friend reacts to your post | 5 XP |

Level thresholds: 0→100, 100→250, 250→500, 500→900, exponential curve to Level 50 ("Legend").

**Level Titles:**
Rookie (1-5) → Grinder (6-10) → Athlete (11-20) → Beast (21-35) → Legend (36-50)

**Badges & Achievements:**

| Badge | Condition |
|---|---|
| First Rep | Complete first workout |
| On Fire | 7-day workout streak |
| Centurion | 100 total workouts |
| Iron Will | 30-day habit streak |
| Big Three | Log at least one set of Bench Press, Squat, and Deadlift (each at least once, any session) |
| Protein King | Hit protein goal 30 days |
| Social Animal | Add 5 friends |
| PR Machine | Hit 10 PRs |
| No Days Off | 30-day workout streak |
| Legend | Reach Level 50 |

New badge unlock → full-screen celebration animation (fire particles) + push notification.

**Weekly Boss Challenges:**
- A weekly "boss" with HP bar: e.g., "Defeat Sloth Boss: Complete 4 workouts this week"
- Boss HP depletes as goals are met
- Defeating boss = bonus XP + exclusive badge
- Boss themes rotate: Volume King, Consistency Master, Nutrition Champion, Discipline Warrior

**Streaks:**
- Workout streak: consecutive calendar days with at least one completed workout. Rest days do NOT break the streak if the user has set that day as a rest day in their training schedule. Unplanned missed days reset it.
- Habit streaks: per habit — must be checked off before midnight local time each day
- Nutrition streak: consecutive days hitting all macros within ±10% of goal
- Streak visualization: flame icon, size grows with streak length (7d → medium, 30d → large), glows brighter with particle effect at 30d+

---

### 5.5 Stats & Reports

**Dashboard Metrics:**
- Total workouts, total kg lifted, total workout hours
- Current streak + all-time best streak
- Level + XP progress

**Muscle Distribution:**
- Pie/radar chart of volume by muscle group (last 30 days)
- Sub-muscle breakdown on drill-down
- "Neglected muscles" alert if a group hasn't been hit in 7+ days

**Calendar Heatmap:**
- GitHub-style calendar (full year view)
- Color intensity = volume that day
- Tap a day to see workout summary

**Progress Charts:**
- Volume over time (weekly bars)
- Per-exercise PR progression (line chart)
- Bodyweight trend (if logged)

**Goal Tracker:**
- Set a goal: "Bench 100kg by 2026-06-01"
- Progress bar + estimated date based on current rate
- "At this pace you'll hit it in 6 weeks" (AI computed)

**Top Exercises:**
- Top 5 by frequency
- Top 5 by total volume
- Top 5 by best PR

**All-Time Bests:**
- Per exercise: best weight, best reps, best estimated 1RM

---

### 5.6 AI Personal Trainer

**Daily Workout Suggestion (automated, shown on Home):**

Suggestion is generated (or refreshed) each time the user opens the app, if the last suggestion is > 4 hours old. Result cached locally until next refresh.

Logic (Claude Edge Function analyzes):
1. Last 7 days of workout history → which muscles were hit, when
2. Sub-muscle granularity: if only upper chest hit, suggest lower/mid pec
3. Rest requirements: flag overworked muscles (< 48h recovery)
4. Progressive overload: if same weight × reps for 3+ sessions, suggest increase
5. Weekly balance: ensure push/pull/legs roughly balanced

Output: "Tonight do Back + Biceps. Focus on lower lats (neglected 2 weeks). Suggested: Pull-ups, Lat Pulldown, Seated Row, Hammer Curl."

**Chat Interface:**
- Conversational Claude trainer
- Context: user's full history, goals, current week's plan
- Example queries: "I only have 20 min", "My shoulder hurts", "What should I eat before leg day?", "Give me a 12-week program"

**Nutrition-Workout Synergy:**
- "You're in a 500kcal deficit — reduce workout intensity today"
- "You hit 180g protein yesterday, great for muscle recovery"

**Weekly Program Generation:**
- Based on training days available (user sets: 3, 4, 5, or 6 days)
- Generates split: PPL, Upper/Lower, Full Body, Bro Split, etc.
- Adjusts monthly for periodization (volume, intensity phases)

---

### 5.7 Social

**Friends:**
- Add by username or QR code
- Friend request system (accept/decline)
- Public profile: level, badges, recent workouts

**Activity Feed:**
- Friends' PRs, streak milestones, badge unlocks, workout completions
- React with: 🔥 💪 ❤️ 👏
- Tap to see workout details

**Leaderboard (Weekly, resets Monday):**
- Tabs: Volume, Streak, XP, Workouts
- Shows rank among friends + global rank
- "You're #1 this week 🔥" push notification on Monday if in lead

**Challenges:**
- Create a head-to-head challenge with a friend: "Who lifts more this week?"
- Accept/decline → both tracked → result at end of week

**Shareable Workout Card:**
- Beautiful generated image: workout name, top stats, muscle groups, fire theme
- One-tap share to Instagram / WhatsApp / X

---

## 6. Database Schema (Supabase / PostgreSQL)

```sql
-- Users
users (id, username, email, avatar_url, bodyweight, goal, training_days, xp, level, created_at)

-- Friends
friendships (id, user_id, friend_id, status, created_at)

-- Exercises (seeded)
exercises (id, name, primary_muscle, sub_muscles[], equipment, instructions, image_url)

-- Workout Sessions
workout_sessions (id, user_id, name, started_at, ended_at, duration_seconds, total_volume_kg, set_count, notes)

-- Workout Sets
workout_sets (id, session_id, exercise_id, set_number, weight_kg, reps, is_pr, completed_at)

-- Nutrition Log
nutrition_logs (id, user_id, date, meal_type, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, source)

-- Nutrition Goals
nutrition_goals (id, user_id, calories, protein_g, carbs_g, fat_g)

-- Habits
habits (id, user_id, name, icon, type, target_count, reminder_time, created_at)

-- Habit Logs
habit_logs (id, habit_id, user_id, date, completed, count_value)

-- Badges
badges (id, name, description, icon, condition_type, condition_value)

-- User Badges
user_badges (id, user_id, badge_id, earned_at)

-- Challenges
challenges (id, challenger_id, opponent_id, type, metric, start_date, end_date, status, winner_id)

-- Reactions
reactions (id, user_id, target_type, target_id, emoji, created_at)

-- Goals
goals (id, user_id, exercise_id, target_weight_kg, target_date, created_at)
```

---

## 7. Gamification — Full Rules

**XP Formula for Workouts:**
`XP = 50 + floor(total_volume_kg / 1000) * 10 + (pr_count * 100)`

**Level Formula:**
`xp_for_level(n) = 100 * n^1.5` (level 1 = 100 XP, level 10 = 3162 XP, level 50 = 353,000 XP)

**Streak Multiplier:**
Workout streak ≥ 7 days → XP multiplier 1.25x
Workout streak ≥ 30 days → XP multiplier 1.5x

---

## 8. Onboarding Flow

1. Splash screen (fire animation, "GYM BUDDY" logotype)
2. Sign up / Log in (email or Google/Apple)
3. "Tell me about yourself": name, age, gender, bodyweight
4. Goal picker: Lose Weight / Build Muscle / Improve Fitness / Powerlifting
5. Training frequency: 3 / 4 / 5 / 6 days per week
6. Nutrition goals (auto-calculated from above, editable)
7. "Find Friends" (contact sync or skip)
8. Tutorial tooltip overlay on Home screen

---

## 9. Notifications

| Trigger | Message |
|---|---|
| Habit reminder | "Time to check in on [Habit Name]! 🔥" |
| Streak at risk | "Don't break your [N]-day streak! Log your workout before midnight." |
| PR achieved | "NEW PR 🏆 You just hit [weight]kg on [exercise]!" |
| Badge unlocked | "Achievement unlocked: [Badge Name]! 🎉" |
| Friend activity | "Rahul just hit a 120kg bench PR 💪" |
| Weekly leaderboard | "You're #1 on the leaderboard this week 🔥 Keep it up!" |
| Low protein | "You're 40g short on protein today. Add a meal to hit your goal." |
| AI suggestion | "Your trainer has a plan for tonight. Tap to see it. ⚡" |

---

## 10. Verification Plan

**Local Development:**
1. `npx expo start` → test on iOS Simulator + Android Emulator
2. Expo Go app for physical device testing

**Key Flows to Test:**
- Full workout session: start → add exercises → sets → end → summary
- Habit check-in with streak increment
- Meal logging via search + barcode scan
- AI trainer suggestion appearing on home
- Friend request + leaderboard update
- Badge unlock animation trigger
- Offline workout logs sync when back online

**Integration Tests:**
- Supabase RLS: user A cannot read user B's private data
- Edge Function: AI trainer returns valid workout JSON
- Streak calculation: midnight boundary handling
- XP + level-up: formula correctness

**Performance Targets:**
- App cold start: < 2s
- Workout screen interactions: < 100ms
- AI suggestion generation: < 3s (Edge Function)
- Local SQLite queries: < 50ms

---

## 11. Out of Scope (v1)

- Apple Watch / Wear OS integration
- Video exercise demos (use image + text)
- Paid subscription / monetization
- Personal trainer marketplace
- Macro scanning from restaurant menus
- Integration with Garmin / Fitbit / Apple Health (v2)
