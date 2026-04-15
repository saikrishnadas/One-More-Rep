import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { useSubscriptionStore } from '../../stores/subscription';
import { calculateTrainingLoad, TrainingLoadResult } from '../../lib/training-load';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../lib/constants';

const SCORE_CIRCLE_SIZE = 56;
const SCORE_CIRCLE_BORDER = 2;

function ScoreCircle({ score, color }: { score: number; color: string }) {
  return (
    <View
      style={[
        styles.scoreCircle,
        { borderColor: color },
      ]}
    >
      <Text style={[styles.scoreText, { color }]}>{score}</Text>
    </View>
  );
}

function DailyBars({
  dailyLoads,
  color,
}: {
  dailyLoads: TrainingLoadResult['dailyLoads'];
  color: string;
}) {
  const BAR_WIDTH = 20;
  const BAR_MAX_HEIGHT = 36;
  const CHART_HEIGHT = BAR_MAX_HEIGHT + 18; // extra for labels
  const BAR_GAP = 8;
  const totalWidth = dailyLoads.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

  return (
    <View style={styles.barsContainer}>
      <Svg width={totalWidth} height={CHART_HEIGHT}>
        {dailyLoads.map((d, i) => {
          const barHeight = Math.max(2, Math.round((d.load / 100) * BAR_MAX_HEIGHT));
          const x = i * (BAR_WIDTH + BAR_GAP);
          const y = BAR_MAX_HEIGHT - barHeight;
          return (
            <Rect
              key={d.date}
              x={x}
              y={y}
              width={BAR_WIDTH}
              height={barHeight}
              rx={3}
              fill={d.load > 0 ? color : Colors.bgCardBorder}
            />
          );
        })}
      </Svg>
      <View style={[styles.barLabels, { width: totalWidth }]}>
        {dailyLoads.map((d) => (
          <Text key={d.date} style={styles.barLabel}>
            {d.date}
          </Text>
        ))}
      </View>
    </View>
  );
}

function TrendText({
  trend,
  trendPct,
}: {
  trend: TrainingLoadResult['trend'];
  trendPct: number;
}) {
  if (trend === 'stable') {
    return (
      <Text style={styles.trendText}>
        <Text style={{ color: Colors.textSecondary }}>→ </Text>
        <Text style={{ color: Colors.textMuted }}>Stable vs last week</Text>
      </Text>
    );
  }
  const arrow = trend === 'up' ? '↑' : '↓';
  const arrowColor = trend === 'up' ? Colors.secondary : Colors.success;
  return (
    <Text style={styles.trendText}>
      <Text style={{ color: arrowColor }}>{arrow} {Math.abs(trendPct)}%</Text>
      <Text style={{ color: Colors.textMuted }}> vs last week</Text>
    </Text>
  );
}

interface Props {
  userId: string;
}

export function TrainingLoadCard({ userId }: Props) {
  const { isPro } = useSubscriptionStore();
  const [result, setResult] = useState<TrainingLoadResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPro || !userId) return;
    setLoading(true);
    calculateTrainingLoad(userId)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [userId, isPro]);

  if (!isPro) {
    return (
      <TouchableOpacity
        onPress={() => router.push('/paywall' as any)}
        activeOpacity={0.8}
      >
        <Card>
          <Text style={styles.headerText}>⚡ Training Load 🔒</Text>
          <Text style={styles.lockedSubtext}>PRO: Know when you&apos;re overtraining</Text>
        </Card>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <Card>
        <Text style={styles.headerText}>⚡ Training Load</Text>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <Card>
      <Text style={styles.headerText}>⚡ Training Load</Text>

      <View style={styles.mainRow}>
        <ScoreCircle score={result.score} color={result.color} />
        <View style={styles.labelBlock}>
          <Text style={[styles.labelText, { color: result.color }]}>{result.label}</Text>
          <TrendText trend={result.trend} trendPct={result.trendPct} />
        </View>
      </View>

      <DailyBars dailyLoads={result.dailyLoads} color={result.color} />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  scoreCircle: {
    width: SCORE_CIRCLE_SIZE,
    height: SCORE_CIRCLE_SIZE,
    borderRadius: SCORE_CIRCLE_SIZE / 2,
    borderWidth: SCORE_CIRCLE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  scoreText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.heavy,
  },
  labelBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  labelText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  trendText: {
    fontSize: FontSize.sm,
  },
  barsContainer: {
    alignItems: 'center',
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  barLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    width: 20,
    textAlign: 'center',
  },
  lockedSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
