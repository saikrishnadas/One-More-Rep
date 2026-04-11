import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { workoutSessions } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { useAuthStore } from '@/stores/auth';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight } from '@/lib/constants';
import { formatDuration, formatVolume } from '@/lib/utils';

interface SessionRow {
  id: string;
  startedAt: Date;
  durationSeconds: number | null;
  totalVolumeKg: number | null;
  setCount: number | null;
  name: string | null;
}

export default function WorkoutScreen() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    if (!user) return;
    db.select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, user.id))
      .orderBy(desc(workoutSessions.startedAt))
      .then(setSessions as any);
  }, [user]);

  function formatSessionDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="heading">Workout History</Text>
        <Button label="▶ Start" onPress={() => router.push('/active-workout')} variant="primary" style={styles.startBtn} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.sessionCard}>
            <View style={styles.cardRow}>
              <View>
                <Text variant="title">{item.name ?? formatSessionDate(item.startedAt)}</Text>
                <Text variant="caption">{formatSessionDate(item.startedAt)}</Text>
              </View>
              <Text style={styles.volumeText}>{formatVolume(item.totalVolumeKg ?? 0)} kg</Text>
            </View>
            <View style={styles.cardStats}>
              <Text variant="caption">⏱ {formatDuration(item.durationSeconds ?? 0)}</Text>
              <Text variant="caption">·</Text>
              <Text variant="caption">{item.setCount ?? 0} sets</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>💪</Text>
            <Text variant="title" style={{ marginTop: Spacing.md }}>No workouts yet</Text>
            <Text variant="caption">Start your first session!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, paddingBottom: Spacing.md,
  },
  startBtn: { paddingVertical: 8, paddingHorizontal: Spacing.md },
  list: { padding: Spacing.xl, paddingTop: 0, gap: Spacing.md },
  sessionCard: { gap: Spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  volumeText: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.primary },
  cardStats: { flexDirection: 'row', gap: Spacing.sm },
  empty: { alignItems: 'center', paddingTop: 80 },
});
