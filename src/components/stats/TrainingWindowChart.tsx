import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, FontSize } from '@/lib/constants';
import { Text } from '@/components/ui/Text';
import { analyzeTrainingWindows, TrainingWindowResult } from '@/lib/training-window';

interface TrainingWindowChartProps {
  userId: string;
}

const BAR_WIDTH = 64;
const CHART_HEIGHT = 120;
const GAP = 24;

export function TrainingWindowChart({ userId }: TrainingWindowChartProps) {
  const [result, setResult] = useState<TrainingWindowResult | null>(null);

  useEffect(() => {
    if (!userId) return;
    analyzeTrainingWindows(userId).then(setResult);
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
        <Text variant="caption">Need 10+ sessions across different times to analyze</Text>
      </View>
    );
  }

  const { brackets, bestBracket, advantage } = result;

  const maxScore = Math.max(...brackets.map(b => b.avgScore), 1);
  const totalWidth = brackets.length * BAR_WIDTH + (brackets.length - 1) * GAP;
  // Extra vertical space: 20px above bars for score labels, 36px below for name + count
  const svgHeight = CHART_HEIGHT + 20 + 36;

  return (
    <View style={styles.container}>
      <Svg width={totalWidth} height={svgHeight}>
        {brackets.map((bracket, i) => {
          const barHeight = Math.max(4, (bracket.avgScore / maxScore) * CHART_HEIGHT);
          const x = i * (BAR_WIDTH + GAP);
          const barY = 20 + (CHART_HEIGHT - barHeight);
          const barColor = bracket.isBest ? Colors.primary : Colors.textMuted + '80';

          return (
            <React.Fragment key={bracket.name}>
              {/* Score above bar */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={barY - 6}
                fontSize={FontSize.sm}
                fill={bracket.isBest ? Colors.primary : Colors.textSecondary}
                textAnchor="middle"
                fontWeight="600"
              >
                {bracket.avgScore}
              </SvgText>

              {/* Bar */}
              <Rect
                x={x}
                y={barY}
                width={BAR_WIDTH}
                height={barHeight}
                rx={4}
                fill={barColor}
              />

              {/* Bracket name below bar */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={20 + CHART_HEIGHT + 16}
                fontSize={FontSize.sm}
                fill={bracket.isBest ? Colors.textPrimary : Colors.textSecondary}
                textAnchor="middle"
                fontWeight={bracket.isBest ? '600' : '400'}
              >
                {bracket.name}
              </SvgText>

              {/* Session count below name */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={20 + CHART_HEIGHT + 32}
                fontSize={FontSize.xs}
                fill={Colors.textMuted}
                textAnchor="middle"
              >
                {bracket.sessionCount} sessions
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {bestBracket && (
        <Text style={styles.insight}>
          You&apos;re {advantage}% stronger in the {bestBracket.name} ({bestBracket.range})
        </Text>
      )}
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
  insight: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
