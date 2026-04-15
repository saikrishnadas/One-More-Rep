import React, { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/auth";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StreakPill } from "@/components/ui/StreakPill";
import { LevelPill } from "@/components/ui/LevelPill";
import { Colors, Spacing, FontSize, FontWeight, Radius } from "@/lib/constants";
import { getTodaySteps, formatSteps, stepsToCalories } from "@/lib/health-sync";
import { router } from "expo-router";
import { db } from "@/db/client";
import { workoutSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatVolume } from "@/lib/utils";
import { useHabitStore } from "@/stores/habits";
import { calcHabitStreak } from "@/lib/xp-service";
import { fetchAiSuggestion } from "@/lib/ai-trainer";
import { useNutritionStore } from "@/stores/nutrition";
import { useOnboardingStore } from "@/stores/onboarding";
import { MuscleStatusCard } from "@/components/home/MuscleStatusCard";
import { WaterCard } from "@/components/home/WaterCard";
import { ReadinessCard } from "@/components/home/ReadinessCard";
import { TrainingWindowCard } from "@/components/home/TrainingWindowCard";
import { TrainingLoadCard } from "@/components/home/TrainingLoadCard";
import { HRVInsightCard } from "@/components/home/HRVInsightCard";
import { useWaterStore } from "@/stores/water";
import { useHealthPlatformStore } from "@/stores/healthPlatform";
import { Flame, Footprints, Zap } from "lucide-react-native";

export default function HomeScreen() {
  const { profile, user } = useAuthStore();
  const { loadToday: loadWaterToday } = useWaterStore();
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [stepsToday, setStepsToday] = useState(0);
  const [stepsAvailable, setStepsAvailable] = useState(false);
  const { habits, logs, loadHabits, loadLogs } = useHabitStore();
  const [overallStreak, setOverallStreak] = useState(0);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { goals: nutritionGoals } = useNutritionStore();
  const { data: onboardingData, load: loadOnboarding } = useOnboardingStore();
  const { connected, fetchReadiness } = useHealthPlatformStore();
  const userAge = (profile as any)?.age ?? 30;

  useFocusEffect(
    React.useCallback(() => {
      if (connected) {
        fetchReadiness(userAge);
      }
    }, [connected, userAge, fetchReadiness])
  );

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    db.select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, user.id))
      .then((rows) => {
        const thisWeek = rows.filter((r) => new Date(r.startedAt) >= weekAgo);
        setWeeklyWorkouts(thisWeek.length);
        setWeeklyVolume(
          thisWeek.reduce((sum, r) => sum + (r.totalVolumeKg ?? 0), 0),
        );
      });
    loadHabits(user.id);
    loadLogs(user.id);
    loadOnboarding(user.id);
    loadWaterToday();
    getTodaySteps().then(({ stepsToday, stepsAvailable }) => {
      setStepsToday(stepsToday);
      setStepsAvailable(stepsAvailable);
    });
  }, [user]);

  useEffect(() => {
    if (habits.length === 0) return;
    const max = Math.max(...habits.map((h) => calcHabitStreak(logs, h.id)));
    setOverallStreak(max);
  }, [habits, logs]);

  useEffect(() => {
    if (!user || !profile) return;
    setAiLoading(true);
    const w = parseFloat(onboardingData.weightKg) || 0;
    const h = parseFloat(onboardingData.heightCm) || 0;
    const bmi = w && h ? w / (h / 100) ** 2 : undefined;
    fetchAiSuggestion(
      {
        totalWorkouts: weeklyWorkouts, // approximate, use what we have
        weeklyWorkouts,
        recentMuscles: [],
        totalVolumeKg: weeklyVolume,
        topExercises: [],
        currentStreak: overallStreak,
      },
      {
        avgCalories: nutritionGoals.calories,
        avgProteinG: nutritionGoals.proteinG,
        daysLogged: 0,
      },
      profile.goal,
      {
        fitnessLevel: onboardingData.fitnessLevel ?? undefined,
        strongMuscles: onboardingData.strongMuscles,
        weakMuscles: onboardingData.weakMuscles,
        availableEquipment: onboardingData.availableEquipment,
        injuries: onboardingData.injuries || undefined,
        dietType: onboardingData.dietType,
        age: onboardingData.age ? parseInt(onboardingData.age) : undefined,
        gender: onboardingData.gender ?? undefined,
        sessionDurationMins: onboardingData.sessionDurationMins,
        bmi,
      },
    )
      .then((result) => setAiSuggestion(result.suggestion))
      .catch(() => setAiSuggestion(null))
      .finally(() => setAiLoading(false));
  }, [weeklyWorkouts]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text variant="caption">Good morning,</Text>
            <Text variant="heading">{profile?.username ?? "Athlete"}</Text>
          </View>
          <Flame size={32} color={Colors.primary} />
        </View>

        <View style={styles.pills}>
          <StreakPill days={overallStreak} />
          <LevelPill level={profile?.level ?? 1} />
        </View>

        <View style={styles.statsRow}>
          {(() => {
            const stats = [
              { label: "This Week", value: `${formatVolume(weeklyVolume)} kg` },
              { label: "Workouts", value: String(weeklyWorkouts) },
              stepsAvailable
                ? { label: "Steps Today", value: formatSteps(stepsToday) }
                : { label: "Avg Protein", value: "0g" },
            ];
            return stats.map((s) => (
              <Card key={s.label} style={styles.statCard}>
                <Text variant="heading" color={Colors.primary}>
                  {s.value}
                </Text>
                <Text variant="label">{s.label}</Text>
              </Card>
            ));
          })()}
        </View>

        {stepsAvailable && (
          <Card style={styles.stepsCard}>
            <View style={styles.stepsRow}>
              <View>
                <View
                  style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
                >
                  <Footprints size={14} color={Colors.textSecondary} />
                  <Text variant="label">Steps Today</Text>
                </View>
                <Text style={styles.stepsValue}>{formatSteps(stepsToday)}</Text>
                <Text variant="caption">
                  ~{stepsToCalories(stepsToday, profile?.bodyweightKg ?? 70)}{" "}
                  kcal burned
                </Text>
              </View>
              <View style={styles.stepsRing}>
                <Text style={styles.stepsRingPct}>
                  {Math.min(Math.round((stepsToday / 10000) * 100), 100)}%
                </Text>
                <Text variant="caption">of 10k</Text>
              </View>
            </View>
            <View style={styles.stepsTrack}>
              <View
                style={[
                  styles.stepsFill,
                  {
                    width:
                      `${Math.min((stepsToday / 10000) * 100, 100)}%` as any,
                  },
                ]}
              />
            </View>
          </Card>
        )}

        <WaterCard />

        <TouchableOpacity
          onPress={() => router.push("/ai-chat")}
          activeOpacity={0.85}
        >
          <Card accent style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View
                style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
              >
                <Zap size={14} color={Colors.primary} />
                <Text variant="label" color={Colors.primary}>
                  COACH
                </Text>
              </View>
              <Text style={styles.chatLink}>Chat →</Text>
            </View>
            {aiLoading ? (
              <ActivityIndicator
                color={Colors.primary}
                style={{ marginTop: Spacing.sm }}
              />
            ) : (
              <Text variant="body" style={{ marginTop: Spacing.sm }}>
                {aiSuggestion ??
                  (weeklyWorkouts === 0
                    ? "Complete your first workout to get personalized coaching!"
                    : "Tap to get personlized workout plan from you coach!")}
              </Text>
            )}
          </Card>
        </TouchableOpacity>

        <MuscleStatusCard userId={user?.id ?? ""} goal={profile?.goal} />

        <TrainingLoadCard userId={user?.id ?? ''} />
        <ReadinessCard />
        <HRVInsightCard />
        <TrainingWindowCard userId={user?.id ?? ''} />

        <Button
          label="START WORKOUT"
          onPress={() => router.push("/active-workout")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pills: { flexDirection: "row", gap: Spacing.sm },
  statsRow: { flexDirection: "row", gap: Spacing.sm },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  aiCard: {},
  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  stepsCard: { gap: Spacing.sm },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepsValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.heavy,
    color: Colors.primary,
  },
  stepsRing: { alignItems: "center" },
  stepsRingPct: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.heavy,
    color: Colors.success,
  },
  stepsTrack: {
    height: 6,
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  stepsFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
  },
});
