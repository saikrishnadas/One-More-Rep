import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { workoutSessions, workoutSets, exercises } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useAuthStore } from '@/stores/auth';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { WorkoutHeatmap } from '@/components/stats/WorkoutHeatmap';
import { VolumeChart } from '@/components/stats/VolumeChart';
import { MuscleBreakdown } from '@/components/stats/MuscleBreakdown';
import { PRList } from '@/components/stats/PRList';
import { OneRMChart, OneRMDataPoint } from '@/components/stats/OneRMChart';
import { IntensityChart } from '@/components/stats/IntensityChart';
import { TrainingWindowChart } from '@/components/stats/TrainingWindowChart';
import { SleepPerformanceChart } from '@/components/stats/SleepPerformanceChart';
import { TrainingLoadCard } from '@/components/home/TrainingLoadCard';
import type { PRRecord } from '@/components/stats/PRList';
import { ChevronLeft } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/lib/constants';
import { formatDate, formatVolume, formatDuration } from '@/lib/utils';
import { useSubscriptionStore } from '@/stores/subscription';

export default function WorkoutStatsScreen() {
  const { user } = useAuthStore();
  const { isPro } = useSubscriptionStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [exerciseMap, setExerciseMap] = useState<Record<string, string>>({});
  const [muscleByExercise, setMuscleByExercise] = useState<Record<string, string>>({});

  // 1RM state
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<{ id: string; name: string }[]>([]);
  const [oneRMData, setOneRMData] = useState<OneRMDataPoint[]>([]);

  // Full exercise rows for 1RM computation (need primaryMuscle already in exerciseMap, but need objects for counting)
  const [allExerciseRows, setAllExerciseRows] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    // Load sessions
    db.select().from(workoutSessions).where(eq(workoutSessions.userId, user.id))
      .then(setSessions);
    // Load all sets for this user's sessions
    db.select().from(workoutSets).then(setSets);
    // Load exercise names
    db.select({ id: exercises.id, name: exercises.name, primaryMuscle: exercises.primaryMuscle })
      .from(exercises)
      .then(rows => {
        const map: Record<string, string> = {};
        const muscleMap: Record<string, string> = {};
        rows.forEach(r => { map[r.id] = r.name; muscleMap[r.id] = r.primaryMuscle; });
        setExerciseMap(map);
        setMuscleByExercise(muscleMap);
        setAllExerciseRows(rows.map(r => ({ id: r.id, name: r.name })));
      });
  }, [user]);

  // Compute top exercises for the 1RM selector once sets + exercise rows are loaded
  useEffect(() => {
    if (sets.length === 0 || allExerciseRows.length === 0) return;

    const exerciseCounts = new Map<string, { name: string; count: number }>();
    for (const set of sets) {
      const ex = allExerciseRows.find(e => e.id === set.exerciseId);
      if (!ex) continue;
      const existing = exerciseCounts.get(set.exerciseId) ?? { name: ex.name, count: 0 };
      exerciseCounts.set(set.exerciseId, { ...existing, count: existing.count + 1 });
    }
    const topExercises = Array.from(exerciseCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, { name }]) => ({ id, name }));
    setExerciseOptions(topExercises);
    if (topExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(topExercises[0].id);
    }
  }, [sets, allExerciseRows]);

  // Compute 1RM data when selected exercise changes
  useEffect(() => {
    if (!selectedExercise) return;
    const exerciseSets = sets.filter(s => s.exerciseId === selectedExercise);

    const sessionMap = new Map<string, { date: string; rm: number; isPR: boolean }>();
    let globalMaxRM = 0;

    for (const s of exerciseSets) {
      const session = sessions.find(sess => sess.id === s.sessionId);
      if (!session) continue;
      const date = new Date(session.startedAt as any).toISOString().split('T')[0];
      const rm = s.weightKg * (1 + s.reps / 30);
      const existing = sessionMap.get(date);
      if (!existing || rm > existing.rm) {
        const isPR = rm > globalMaxRM;
        if (rm > globalMaxRM) globalMaxRM = rm;
        sessionMap.set(date, { date, rm: Math.round(rm * 10) / 10, isPR });
      }
    }

    const points = Array.from(sessionMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    setOneRMData(points.map(p => ({ date: p.date, estimated1RM: p.rm, isPR: p.isPR })));
  }, [selectedExercise, sets, sessions]);

  // All-time stats
  const totalWorkouts = sessions.length;
  const totalVolume = sessions.reduce((s, r) => s + (r.totalVolumeKg ?? 0), 0);
  const totalDuration = sessions.reduce((s, r) => s + (r.durationSeconds ?? 0), 0);
  const totalSets = sessions.reduce((s, r) => s + (r.setCount ?? 0), 0);

  // Heatmap data
  const workoutDates = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => {
      const date = formatDate(new Date(s.startedAt));
      map[date] = (map[date] ?? 0) + 1;
    });
    return map;
  }, [sessions]);

  // Muscle breakdown: count sets per muscle
  const muscleCounts = useMemo(() => {
    const map: Record<string, number> = {};
    sets.forEach(s => {
      const muscle = muscleByExercise[s.exerciseId];
      if (muscle) map[muscle] = (map[muscle] ?? 0) + 1;
    });
    return map;
  }, [sets, muscleByExercise]);

  // PRs: find max weight per exercise from sets marked isPr=true
  const prRecords = useMemo((): PRRecord[] => {
    const best: Record<string, { weightKg: number; reps: number; date: string }> = {};
    sets.filter(s => s.isPr).forEach(s => {
      const prev = best[s.exerciseId];
      if (!prev || s.weightKg > prev.weightKg) {
        const session = sessions.find(ss => ss.id === s.sessionId);
        best[s.exerciseId] = {
          weightKg: s.weightKg,
          reps: s.reps,
          date: session ? formatDate(new Date(session.startedAt)) : '',
        };
      }
    });
    return Object.entries(best)
      .map(([exId, pr]) => ({ exerciseName: exerciseMap[exId] ?? exId, ...pr }))
      .sort((a, b) => b.weightKg - a.weightKg)
      .slice(0, 10);
  }, [sets, sessions, exerciseMap]);

  // Intensity trend: last 20 sessions with an intensity score
  const intensityData = useMemo(() => {
    return sessions
      .filter(s => s.intensityScore != null)
      .slice(-20)
      .map(s => {
        const score = s.intensityScore as number;
        const date = new Date(s.startedAt as any).toISOString().split('T')[0].slice(5); // MM-DD
        const color = score < 40 ? '#22c55e' : score < 70 ? '#f59e0b' : '#ef4444';
        return { date, score, color };
      });
  }, [sessions]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text variant="heading" style={{ flex: 1, textAlign: 'center' }}>Stats</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* All-time stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Workouts', value: String(totalWorkouts) },
            { label: 'Volume', value: `${formatVolume(totalVolume)} kg` },
            { label: 'Total Sets', value: String(totalSets) },
            { label: 'Time', value: formatDuration(totalDuration) },
          ].map(s => (
            <Card key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text variant="label">{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Workout heatmap */}
        <Card>
          <Text variant="title" style={styles.cardTitle}>Activity — Past Year</Text>
          <WorkoutHeatmap workoutDates={workoutDates} />
        </Card>

        {/* Volume chart */}
        <Card>
          <Text variant="title" style={styles.cardTitle}>Volume Trend</Text>
          <VolumeChart sessions={sessions} />
        </Card>

        {/* Muscle breakdown */}
        <Card>
          <Text variant="title" style={styles.cardTitle}>Muscle Focus</Text>
          <MuscleBreakdown muscleCounts={muscleCounts} />
        </Card>

        {/* PRs */}
        <Card>
          <Text variant="title" style={styles.cardTitle}>Personal Records {'\u{1F3C6}'}</Text>
          <PRList records={prRecords} />
        </Card>

        {/* Training Load */}
        <TrainingLoadCard userId={user?.id ?? ''} />

        {/* Intensity Trend */}
        <Card>
          <Text variant="title" style={styles.cardTitle}>Intensity Trend</Text>
          {isPro ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <IntensityChart data={intensityData} />
            </ScrollView>
          ) : (
            <View style={styles.lockedSection}>
              <Text variant="label" style={{ marginBottom: Spacing.xs }}>Intensity Trend {'\u{1F512}'}</Text>
              <Text variant="caption" style={{ textAlign: 'center' }}>PRO: Track how hard your sessions are over time</Text>
            </View>
          )}
        </Card>

        {/* Best Training Window */}
        <Card style={{ marginTop: Spacing.md, padding: Spacing.md }}>
          <Text variant="title" style={{ marginBottom: Spacing.sm }}>Best Training Window</Text>
          {isPro ? (
            <TrainingWindowChart userId={user?.id ?? ''} />
          ) : (
            <TouchableOpacity onPress={() => router.push('/paywall' as any)} activeOpacity={0.7}>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.md }}>
                Best Training Window 🔒
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs }}>
                PRO: Discover when you&apos;re strongest
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Sleep vs Performance */}
        <Card style={{ marginTop: Spacing.md, padding: Spacing.md }}>
          <Text variant="title" style={{ marginBottom: Spacing.sm }}>Sleep vs Performance</Text>
          {isPro ? (
            <SleepPerformanceChart userId={user?.id ?? ''} />
          ) : (
            <TouchableOpacity onPress={() => router.push('/paywall' as any)} activeOpacity={0.7}>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.md }}>
                Sleep vs Performance 🔒
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs }}>
                PRO: See how sleep affects your strength
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* 1RM Progress */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text variant="label" style={{ marginBottom: Spacing.md }}>{'\u{1F4C8}'} 1RM Progress</Text>
          {/* Exercise selector - horizontal ScrollView of chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {exerciseOptions.map(ex => (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => setSelectedExercise(ex.id)}
                  style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 6,
                    backgroundColor: selectedExercise === ex.id ? Colors.primary + '20' : Colors.bgCard,
                    borderRadius: Radius.full,
                    borderWidth: 1,
                    borderColor: selectedExercise === ex.id ? Colors.primary : Colors.bgCardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: FontSize.sm,
                      color: selectedExercise === ex.id ? Colors.primary : Colors.textSecondary,
                    }}
                  >
                    {ex.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <OneRMChart
            data={oneRMData}
            exerciseName={exerciseOptions.find(e => e.id === selectedExercise)?.name ?? ''}
          />
          <Text variant="caption" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
            {'\u{1F7E0}'} = Personal Record
          </Text>
        </Card>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  content: { padding: Spacing.xl, gap: Spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: { width: '47%', alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.primary },
  cardTitle: { marginBottom: Spacing.md },
  lockedSection: { padding: Spacing.lg, alignItems: 'center' },
});
