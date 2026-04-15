import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, FontSize } from '@/lib/constants';
import { Text } from '@/components/ui/Text';
import { analyzeSleepPerformance, SleepPerformanceResult } from '@/lib/sleep-performance';

interface SleepPerformanceChartProps {
  userId: string;
}

const SVG_WIDTH = 280;
const SVG_HEIGHT = 160;

// X axis: sleep hours 4h → 10h mapped to 0px → 280px
function scaleX(sleepHours: number): number {
  return ((sleepHours - 4) / (10 - 4)) * SVG_WIDTH;
}

// Y axis: intensity 0 → 100 mapped to 160px → 0px
function scaleY(intensity: number): number {
  return SVG_HEIGHT - (intensity / 100) * SVG_HEIGHT;
}

function pointColor(sleepHours: number): string {
  if (sleepHours >= 7) return '#22c55e';
  if (sleepHours < 6) return '#ef4444';
  return '#f59e0b';
}

export function SleepPerformanceChart({ userId }: SleepPerformanceChartProps) {
  const [result, setResult] = useState<SleepPerformanceResult | null>(null);

  useEffect(() => {
    if (!userId) return;
    analyzeSleepPerformance(userId).then(setResult);
  }, [userId]);

  if (!result) {
    return (
      <View style={styles.empty}>
        <Text variant="caption">Loading...</Text>
      </View>
    );
  }

  if (!result.hasEnoughData) {
    return (
      <View style={styles.empty}>
        <Text variant="caption">Need 5+ workouts with sleep data to analyze</Text>
      </View>
    );
  }

  const { dataPoints, insight, differencePercent } = result;

  // X axis tick labels
  const xTicks = [4, 6, 7, 8, 10];
  // Y axis tick labels
  const yTicks = [0, 50, 100];

  return (
    <View style={styles.container}>
      <Svg width={SVG_WIDTH} height={SVG_HEIGHT}>
        {/* Y axis grid lines */}
        {yTicks.map(tick => (
          <Line
            key={`ygrid-${tick}`}
            x1={0}
            y1={scaleY(tick)}
            x2={SVG_WIDTH}
            y2={scaleY(tick)}
            stroke={Colors.textMuted + '30'}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        {/* X axis line */}
        <Line
          x1={0}
          y1={SVG_HEIGHT}
          x2={SVG_WIDTH}
          y2={SVG_HEIGHT}
          stroke={Colors.textMuted + '60'}
          strokeWidth={1}
        />

        {/* X axis tick labels */}
        {xTicks.map(tick => (
          <SvgText
            key={`xtick-${tick}`}
            x={scaleX(tick)}
            y={SVG_HEIGHT - 4}
            fontSize={FontSize.xs}
            fill={Colors.textMuted}
            textAnchor="middle"
          >
            {tick}h
          </SvgText>
        ))}

        {/* Y axis label */}
        <SvgText
          x={4}
          y={12}
          fontSize={FontSize.xs}
          fill={Colors.textMuted}
        >
          100
        </SvgText>
        <SvgText
          x={4}
          y={SVG_HEIGHT / 2}
          fontSize={FontSize.xs}
          fill={Colors.textMuted}
        >
          50
        </SvgText>

        {/* Data points */}
        {dataPoints.map((point, i) => (
          <Circle
            key={`point-${i}`}
            cx={scaleX(point.sleepHours)}
            cy={scaleY(point.intensityScore)}
            r={4}
            fill={pointColor(point.sleepHours)}
            opacity={0.85}
          />
        ))}
      </Svg>

      {/* X axis label */}
      <Text style={styles.axisLabel}>Sleep Hours</Text>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>7h+</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>6-7h</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>{'<6h'}</Text>
        </View>
      </View>

      {/* Insight text */}
      {insight ? (
        <Text style={[styles.insight, differencePercent > 0 && styles.insightHighlight]}>
          {insight}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  empty: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  axisLabel: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  insight: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  insightHighlight: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
