import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StreakPill } from '@/components/ui/StreakPill';
import { LevelPill } from '@/components/ui/LevelPill';
import { Colors, Spacing } from '@/lib/constants';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { workoutSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatVolume } from '@/lib/utils';

export default function HomeScreen() {
  const { profile, user } = useAuthStore();
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);

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
        setWeeklyVolume(thisWeek.reduce((sum, r) => sum + (r.totalVolumeKg ?? 0), 0));
      });
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text variant="caption">Good morning,</Text>
            <Text variant="heading">{profile?.username ?? 'Athlete'} 👋</Text>
          </View>
          <Text style={{ fontSize: 32 }}>🔥</Text>
        </View>

        <View style={styles.pills}>
          <StreakPill days={0} />
          <LevelPill level={profile?.level ?? 1} />
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'This Week', value: `${formatVolume(weeklyVolume)} kg` },
            { label: 'Workouts', value: String(weeklyWorkouts) },
            { label: 'Avg Protein', value: '0g' },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text variant="heading" color={Colors.primary}>{s.value}</Text>
              <Text variant="label">{s.label}</Text>
            </Card>
          ))}
        </View>

        <Card accent style={styles.aiCard}>
          <Text variant="label" color={Colors.primary}>⚡ AI TRAINER</Text>
          <Text variant="body" style={{ marginTop: Spacing.sm }}>
            {weeklyWorkouts === 0
              ? 'Complete your first workout so your AI trainer can learn your patterns!'
              : `${weeklyWorkouts} workout${weeklyWorkouts > 1 ? 's' : ''} this week. Keep it up!`}
          </Text>
        </Card>

        <Button
          label="▶ START WORKOUT"
          onPress={() => router.push('/active-workout')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pills: { flexDirection: 'row', gap: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  aiCard: { gap: Spacing.xs },
});
