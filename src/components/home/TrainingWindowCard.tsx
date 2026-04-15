import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { analyzeTrainingWindows, TrainingWindowResult, BracketData } from '@/lib/training-window';
import { useSubscriptionStore } from '@/stores/subscription';

interface Props {
  userId: string;
}

function BarRow({ bracket, maxScore }: { bracket: BracketData; maxScore: number }) {
  const fillRatio = maxScore > 0 ? bracket.avgScore / maxScore : 0;

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{bracket.name}</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.round(fillRatio * 100)}%` as any,
              backgroundColor: bracket.isBest ? Colors.primary : Colors.textMuted,
            },
          ]}
        />
      </View>
      <Text style={[styles.barScore, bracket.isBest && { color: Colors.primary }]}>
        {bracket.avgScore}
      </Text>
      {bracket.isBest ? (
        <View style={styles.bestTag}>
          <Text style={styles.bestTagText}>Best</Text>
        </View>
      ) : (
        <View style={styles.bestTagPlaceholder} />
      )}
    </View>
  );
}

export function TrainingWindowCard({ userId }: Props) {
  const { isPro } = useSubscriptionStore();
  const [result, setResult] = useState<TrainingWindowResult | null>(null);

  useEffect(() => {
    if (!isPro || !userId) return;
    analyzeTrainingWindows(userId).then(setResult);
  }, [userId, isPro]);

  if (!isPro) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/paywall' as any)}>
        <Card style={styles.card}>
          <Text style={styles.title}>🕐 Best Training Window 🔒</Text>
          <Text variant="caption" style={styles.mutedText}>
            PRO: Discover when you&apos;re strongest
          </Text>
        </Card>
      </TouchableOpacity>
    );
  }

  if (!result || !result.hasEnoughData) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>🕐 Best Training Window</Text>
        <Text variant="caption" style={styles.mutedText}>
          Keep training at different times — need 10+ sessions to analyze
        </Text>
      </Card>
    );
  }

  const maxScore = Math.max(...result.brackets.map((b) => b.avgScore));

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>🕐 Best Training Window</Text>
      <View style={styles.barsContainer}>
        {result.brackets.map((bracket) => (
          <BarRow key={bracket.name} bracket={bracket} maxScore={maxScore} />
        ))}
      </View>
      {result.bestBracket && (
        <Text variant="caption" style={styles.insightText}>
          You&apos;re {result.advantage}% stronger in the {result.bestBracket.name} ({result.bestBracket.range})
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  mutedText: {
    color: Colors.textMuted,
  },
  barsContainer: {
    gap: Spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barLabel: {
    width: 72,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCardBorder,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  barScore: {
    width: 28,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    textAlign: 'right',
  },
  bestTag: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  bestTagText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  bestTagPlaceholder: {
    width: 36,
  },
  insightText: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
