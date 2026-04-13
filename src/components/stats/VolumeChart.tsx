import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize } from '@/lib/constants';
import { formatDate, formatVolume } from '@/lib/utils';

interface Props {
  // Array of { date: 'YYYY-MM-DD', volumeKg: number } for all sessions
  sessions: { startedAt: Date; totalVolumeKg: number | null }[];
}

const CHART_W = 320;
const CHART_H = 120;
const BAR_GAP = 4;
const WEEKS = 8;

export function VolumeChart({ sessions }: Props) {
  const bars = useMemo(() => {
    const today = new Date();
    const result: { label: string; volume: number }[] = [];
    for (let w = WEEKS - 1; w >= 0; w--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      const weekStartStr = formatDate(weekStart);
      const weekEndStr = formatDate(weekEnd);

      const volume = sessions
        .filter(s => {
          const d = formatDate(new Date(s.startedAt));
          return d >= weekStartStr && d <= weekEndStr;
        })
        .reduce((sum, s) => sum + (s.totalVolumeKg ?? 0), 0);

      const label = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      result.push({ label, volume });
    }
    return result;
  }, [sessions]);

  const maxVol = Math.max(...bars.map(b => b.volume), 1);
  const barW = (CHART_W - BAR_GAP * (WEEKS - 1)) / WEEKS;

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H + 20}>
        {bars.map((bar, i) => {
          const barH = Math.max((bar.volume / maxVol) * CHART_H, bar.volume > 0 ? 4 : 0);
          const x = i * (barW + BAR_GAP);
          const y = CHART_H - barH;
          return (
            <React.Fragment key={i}>
              <Rect
                x={x} y={y} width={barW} height={barH}
                rx={3} fill={bar.volume > 0 ? Colors.primary : Colors.bgCardBorder}
                opacity={bar.volume > 0 ? 1 : 0.3}
              />
              <SvgText
                x={x + barW / 2} y={CHART_H + 14}
                textAnchor="middle"
                fontSize={FontSize.xs}
                fill={Colors.textMuted}
              >
                {bar.label.split(' ')[0]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.legendRow}>
        <Text variant="caption">8-week volume (kg)</Text>
        <Text variant="caption" color={Colors.primary}>
          {formatVolume(bars.reduce((s, b) => s + b.volume, 0))} kg total
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
});
