import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { formatDuration, formatVolume } from '@/lib/utils';
import { syncWorkoutSession } from '@/lib/workout-sync';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444', back: '#3b82f6', shoulders: '#a855f7',
  biceps: '#f59e0b', triceps: '#f97316', quads: '#22c55e',
  hamstrings: '#06b6d4', glutes: '#ec4899', calves: '#84cc16',
  abs: '#f97316', traps: '#6366f1',
};

export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams<{
    sessionId: string;
    durationSeconds: string;
    totalVolumeKg: string;
    setCount: string;
    prCount: string;
    musclesWorked: string;
    xpEarned: string;
  }>();

  // Sync to Supabase in background
  useEffect(() => {
    if (params.sessionId) {
      syncWorkoutSession(params.sessionId).catch(console.warn);
    }
  }, []);

  const duration = parseInt(params.durationSeconds ?? '0');
  const volume = parseFloat(params.totalVolumeKg ?? '0');
  const sets = parseInt(params.setCount ?? '0');
  const prs = parseInt(params.prCount ?? '0');
  const muscles = params.musclesWorked ? params.musclesWorked.split(',').filter(Boolean) : [];
  const xp = parseInt(params.xpEarned ?? '0');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <Text style={styles.heroIcon}>{prs > 0 ? '🏆' : '💪'}</Text>
        <Text variant="heading" style={styles.heroTitle}>
          {prs > 0 ? 'New Personal Records!' : 'Workout Complete!'}
        </Text>

        {/* XP earned */}
        <Card accent style={styles.xpCard}>
          <Text variant="label" color={Colors.primary}>⚡ XP EARNED</Text>
          <Text style={styles.xpValue}>+{xp} XP</Text>
        </Card>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Duration', value: formatDuration(duration) },
            { label: 'Volume', value: `${formatVolume(volume)} kg` },
            { label: 'Sets', value: String(sets) },
            { label: 'PRs', value: String(prs) },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text variant="heading" color={Colors.primary}>{s.value}</Text>
              <Text variant="label">{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Muscles worked */}
        {muscles.length > 0 && (
          <Card style={styles.musclesCard}>
            <Text variant="label" style={{ marginBottom: Spacing.md }}>Muscles Worked</Text>
            <View style={styles.muscleChips}>
              {muscles.map((m) => (
                <View key={m} style={[styles.muscleChip, { backgroundColor: (MUSCLE_COLORS[m] ?? Colors.primary) + '25', borderColor: MUSCLE_COLORS[m] ?? Colors.primary }]}>
                  <Text style={[styles.muscleChipText, { color: MUSCLE_COLORS[m] ?? Colors.primary }]}>
                    {m}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* PR callout */}
        {prs > 0 && (
          <Card accent style={styles.prCard}>
            <Text variant="label" color={Colors.primary}>🏆 PERSONAL RECORDS</Text>
            <Text variant="body" style={{ marginTop: Spacing.sm }}>
              You set {prs} new PR{prs > 1 ? 's' : ''} today. Keep pushing!
            </Text>
          </Card>
        )}

        <Button label="Back to Home" onPress={() => router.replace('/(tabs)')} style={styles.homeBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, alignItems: 'center' },
  heroIcon: { fontSize: 72, marginTop: Spacing.xl },
  heroTitle: { textAlign: 'center' },
  xpCard: { width: '100%', alignItems: 'center', gap: Spacing.sm },
  xpValue: { fontSize: FontSize.display, fontWeight: FontWeight.heavy, color: Colors.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, width: '100%' },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', gap: 4 },
  musclesCard: { width: '100%' },
  muscleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  muscleChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  muscleChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  prCard: { width: '100%' },
  homeBtn: { width: '100%', marginTop: Spacing.md },
});
