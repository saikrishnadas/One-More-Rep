import React from 'react';
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

export default function HomeScreen() {
  const { profile } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="caption">Good morning,</Text>
            <Text variant="heading">{profile?.username ?? 'Athlete'} 👋</Text>
          </View>
          <Text style={{ fontSize: 32 }}>🔥</Text>
        </View>

        {/* Streak + Level */}
        <View style={styles.pills}>
          <StreakPill days={0} />
          <LevelPill level={profile?.level ?? 1} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'This Week', value: '0 kg' },
            { label: 'Workouts', value: '0' },
            { label: 'Avg Protein', value: '0g' },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text variant="heading" color={Colors.primary}>{s.value}</Text>
              <Text variant="label">{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* AI Suggestion placeholder */}
        <Card accent style={styles.aiCard}>
          <Text variant="label" color={Colors.primary}>⚡ AI TRAINER</Text>
          <Text variant="body" style={{ marginTop: Spacing.sm }}>
            Complete your first workout so your AI trainer can learn your patterns!
          </Text>
        </Card>

        {/* Start Workout CTA */}
        <Button
          label="▶ START WORKOUT"
          onPress={() => router.push('/active-workout')}
          style={styles.ctaBtn}
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
  ctaBtn: {},
});
