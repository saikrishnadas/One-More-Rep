import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useOnboardingStore } from '@/stores/onboarding';
import { estimateGoal, GoalEstimate } from '@/lib/goal-estimator';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/lib/constants';
import { ChevronLeft, Target, TrendingDown, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react-native';

export default function GoalEstimateScreen() {
  const { user, profile } = useAuthStore();
  const { data: onboarding } = useOnboardingStore();
  const [estimate, setEstimate] = useState<GoalEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const target = (onboarding as any)?.targetWeightKg ? parseFloat(String((onboarding as any).targetWeightKg)) : null;
    estimateGoal(user.id, profile?.goal ?? null, target)
      .then(setEstimate)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text variant="heading" style={{ flex: 1, textAlign: 'center' }}>Goal Estimate</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : !estimate ? (
        <View style={styles.center}><Text variant="body">Unable to load data.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.goalBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Target size={20} color={Colors.primary} />
              <Text variant="label" color={Colors.primary}>YOUR GOAL</Text>
            </View>
            <Text variant="heading" style={{ textTransform: 'capitalize' }}>{estimate.goal.replace(/_/g, ' ')}</Text>
          </Card>

          {estimate.estimatedDate ? (
            <Card style={styles.dateCard}>
              <Text variant="caption">Estimated completion</Text>
              <Text style={styles.dateText}>{estimate.estimatedDate}</Text>
              <Text variant="label">{estimate.weeksRemaining} weeks away</Text>
              {estimate.weeklyRate != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {estimate.weeklyRate < 0 ? <TrendingDown size={14} color={Colors.success} /> : <TrendingUp size={14} color={Colors.warning} />}
                  <Text variant="caption">
                    {Math.abs(estimate.weeklyRate).toFixed(2)} kg/week {estimate.weeklyRate < 0 ? 'loss' : 'gain'}
                  </Text>
                </View>
              )}
              <Text variant="caption" style={{ marginTop: Spacing.xs, color: Colors.textMuted }}>{estimate.confidenceNote}</Text>
            </Card>
          ) : (
            <Card style={{ gap: Spacing.sm, alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Text variant="title" style={{ textAlign: 'center' }}>Not enough data yet</Text>
              <Text variant="caption" style={{ textAlign: 'center' }}>{estimate.confidenceNote}</Text>
              <Text variant="caption" style={{ textAlign: 'center', color: Colors.primary }}>
                Log your weight in Body & Measurements at least twice to see your estimated goal date.
              </Text>
            </Card>
          )}

          <Card style={{ gap: Spacing.md }}>
            <Text variant="title">Adherence Score</Text>
            <View style={styles.adherenceRow}>
              {estimate.onTrack
                ? <CheckCircle size={24} color={Colors.success} />
                : <AlertCircle size={24} color={Colors.warning} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.adherenceScore}>{estimate.adherenceScore}%</Text>
                <Text variant="caption">{estimate.onTrack ? 'On track — keep it up!' : 'Below 70% — consistency needs work'}</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {
                width: `${estimate.adherenceScore}%` as any,
                backgroundColor: estimate.onTrack ? Colors.success : Colors.warning,
              }]} />
            </View>
            <Text variant="caption">Based on workout frequency + habit completion (last 30 days)</Text>
          </Card>

          {estimate.currentValue != null && (
            <Card style={{ gap: Spacing.sm }}>
              <Text variant="title">Weight Progress</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={styles.weightBlock}>
                  <Text style={styles.weightValue}>{estimate.currentValue.toFixed(1)} kg</Text>
                  <Text variant="caption">Current</Text>
                </View>
                {estimate.targetValue != null && (
                  <View style={styles.weightBlock}>
                    <Text style={[styles.weightValue, { color: Colors.primary }]}>{estimate.targetValue.toFixed(1)} kg</Text>
                    <Text variant="caption">Target</Text>
                  </View>
                )}
                {estimate.targetValue != null && estimate.currentValue != null && (
                  <View style={styles.weightBlock}>
                    <Text style={styles.weightValue}>{Math.abs(estimate.targetValue - estimate.currentValue).toFixed(1)} kg</Text>
                    <Text variant="caption">To go</Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          <Card style={{ gap: Spacing.sm }}>
            <Text variant="caption" style={{ fontStyle: 'italic', lineHeight: 20 }}>
              Disclaimer: This estimate is based on your current weight trend and consistency. Real results depend on many factors including sleep, stress, and diet quality. Use this as motivation, not a contract.
            </Text>
          </Card>

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  goalBanner: { gap: Spacing.sm },
  dateCard: { gap: 4, alignItems: 'center', paddingVertical: Spacing.xl },
  dateText: { fontSize: 32, fontWeight: FontWeight.heavy, color: Colors.primary },
  adherenceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  adherenceScore: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  progressBar: { height: 8, backgroundColor: Colors.bgCardBorder, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full },
  weightBlock: { alignItems: 'center', gap: 4 },
  weightValue: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
});
