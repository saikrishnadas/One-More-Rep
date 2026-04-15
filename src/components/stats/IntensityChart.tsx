import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Colors, Spacing, FontSize, Radius } from '@/lib/constants';
import { Text } from '@/components/ui/Text';

interface IntensityEntry {
  date: string;
  score: number;
  color: string;
}

interface IntensityChartProps {
  data: IntensityEntry[];
}

const CHART_HEIGHT = 160;
const BAR_GAP = 4;

function getBarColor(score: number): string {
  if (score < 40) return '#22c55e';
  if (score < 70) return '#f59e0b';
  return '#ef4444';
}

export function IntensityChart({ data }: IntensityChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="caption">Complete workouts to see intensity trends</Text>
      </View>
    );
  }

  const barWidth = Math.max(8, Math.min(24, (300 - data.length * BAR_GAP) / data.length));
  const chartWidth = data.length * (barWidth + BAR_GAP);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT + 24}>
        {[25, 50, 75].map((val) => (
          <Line
            key={val}
            x1={0}
            y1={CHART_HEIGHT - (val / 100) * CHART_HEIGHT}
            x2={chartWidth}
            y2={CHART_HEIGHT - (val / 100) * CHART_HEIGHT}
            stroke={Colors.textMuted + '30'}
            strokeWidth={1}
          />
        ))}
        {data.map((entry, i) => {
          const barHeight = Math.max(2, (entry.score / 100) * CHART_HEIGHT);
          const x = i * (barWidth + BAR_GAP);
          const y = CHART_HEIGHT - barHeight;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={barWidth} height={barHeight} rx={2} fill={getBarColor(entry.score)} />
              {i % 5 === 0 && (
                <SvgText x={x + barWidth / 2} y={CHART_HEIGHT + 14} fontSize={9} fill={Colors.textMuted} textAnchor="middle">
                  {entry.date}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: Spacing.sm },
  empty: { padding: Spacing.lg, alignItems: 'center' },
});
