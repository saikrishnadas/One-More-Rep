import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { analyzeHRVTrend, HRVTrendResult } from '@/lib/hrv-trend';
import { useSubscriptionStore } from '@/stores/subscription';

export function HRVInsightCard() {
  const { isPro } = useSubscriptionStore();
  const [result, setResult] = useState<HRVTrendResult | null>(null);

  useEffect(() => {
    if (!isPro) return;
    analyzeHRVTrend().then(setResult);
  }, [isPro]);

  if (!isPro) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/paywall' as any)}>
        <Card style={styles.card}>
          <Text style={styles.title}>❤️ HRV Training Insights 🔒</Text>
          <Text variant="caption" style={styles.mutedText}>
            PRO: Know when to push hard or rest
          </Text>
        </Card>
      </TouchableOpacity>
    );
  }

  if (!result || !result.hasEnoughData) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>❤️ HRV Insight</Text>
        <Text variant="caption" style={styles.mutedText}>
          Wear your watch to sleep for HRV insights
        </Text>
      </Card>
    );
  }

  const { currentHRV, percentOfBaseline, recommendation } = result;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>❤️ HRV Insight</Text>

      <View style={styles.contentRow}>
        <View style={[styles.badge, { backgroundColor: recommendation.color + '22' }]}>
          <Text style={[styles.badgeText, { color: recommendation.color }]}>
            {recommendation.label}
          </Text>
        </View>
      </View>

      <Text style={styles.statsText}>
        HRV {currentHRV}ms ({percentOfBaseline}% of baseline)
      </Text>

      <Text style={styles.detailText}>{recommendation.detail}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  statsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  mutedText: {
    color: Colors.textMuted,
  },
});
