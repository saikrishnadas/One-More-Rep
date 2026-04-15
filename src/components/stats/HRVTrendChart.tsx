import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/lib/constants';
import { analyzeHRVTrend, HRVTrendResult } from '@/lib/hrv-trend';

interface Props {
  userId: string;
}

export function HRVTrendChart({ userId: _userId }: Props) {
  const [result, setResult] = useState<HRVTrendResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeHRVTrend()
      .then(setResult)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.lg }} />;
  }

  if (!result || !result.hasEnoughData) {
    return (
      <Text style={styles.emptyText}>
        Need 7+ days of HRV data from your watch
      </Text>
    );
  }

  const { points, currentHRV, sevenDayAvg, percentOfBaseline, recommendation } = result;

  // SVG dimensions
  const svgWidth = 300;
  const svgHeight = 140;

  const xScale = (i: number) => (i / (points.length - 1)) * 280 + 10;
  const minY = Math.min(...points.map(p => Math.min(p.value, p.movingAvg))) * 0.8;
  const maxY = Math.max(...points.map(p => Math.max(p.value, p.movingAvg))) * 1.1;
  const yScale = (v: number) => 130 - ((v - minY) / (maxY - minY)) * 120;

  // Build polyline point strings
  const rawPoints = points.map((p, i) => `${xScale(i)},${yScale(p.value)}`).join(' ');
  const avgPoints = points.map((p, i) => `${xScale(i)},${yScale(p.movingAvg)}`).join(' ');

  // Latest dot
  const lastIdx = points.length - 1;
  const lastX = xScale(lastIdx);
  const lastY = yScale(points[lastIdx].value);

  // X-axis labels: show ~5 evenly spaced dates
  const labelIndices = [0, Math.floor(lastIdx * 0.25), Math.floor(lastIdx * 0.5), Math.floor(lastIdx * 0.75), lastIdx];

  return (
    <View style={styles.container}>
      {/* Chart */}
      <Svg width={svgWidth} height={svgHeight}>
        {/* Raw HRV line */}
        <Polyline
          points={rawPoints}
          fill="none"
          stroke={Colors.textMuted}
          strokeWidth={1}
          opacity={0.5}
          strokeDasharray="3,3"
        />
        {/* 7-day moving average line */}
        <Polyline
          points={avgPoints}
          fill="none"
          stroke={Colors.primary}
          strokeWidth={2}
        />
        {/* Latest data point dot */}
        <Circle
          cx={lastX}
          cy={lastY}
          r={5}
          fill={recommendation.color}
          stroke={Colors.bgCard}
          strokeWidth={1.5}
        />
        {/* X-axis labels */}
        {labelIndices.map((idx) => (
          <SvgText
            key={idx}
            x={xScale(idx)}
            y={svgHeight - 2}
            fontSize={8}
            fill={Colors.textMuted}
            textAnchor="middle"
          >
            {points[idx].date}
          </SvgText>
        ))}
      </Svg>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>
          HRV: <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{currentHRV} ms</Text>
        </Text>
        <Text style={styles.statText}>
          Baseline: <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{sevenDayAvg} ms</Text>
        </Text>
        <Text style={[styles.statText, { color: recommendation.color }]}>
          {percentOfBaseline}% of baseline
        </Text>
      </View>

      {/* Recommendation card */}
      <View style={[styles.recCard, { borderColor: recommendation.color + '44', backgroundColor: recommendation.color + '18' }]}>
        <View style={[styles.recBadge, { backgroundColor: recommendation.color + '33' }]}>
          <Text style={[styles.recLabel, { color: recommendation.color }]}>
            {recommendation.label}
          </Text>
        </View>
        <Text style={styles.recDetail}>{recommendation.detail}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: Colors.textMuted, opacity: 0.5 }]} />
          <Text style={styles.legendText}>Raw HRV</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>7-day avg</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.base,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statValue: {
    fontWeight: FontWeight.bold,
  },
  recCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  recBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  recLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  recDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
