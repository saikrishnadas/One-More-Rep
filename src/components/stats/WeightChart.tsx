import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize } from '@/lib/constants';

interface Props {
  data: { date: string; weightKg: number }[];
  days?: 30 | 90 | 365;
}

export function WeightChart({ data, days = 90 }: Props) {
  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data
      .filter(d => new Date(d.date) >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, days]);

  if (filtered.length < 2) {
    return (
      <View style={styles.empty}>
        <Text variant="caption">Log at least 2 entries to see your weight trend</Text>
      </View>
    );
  }

  const W = 320, H = 140, PAD = { top: 12, right: 12, bottom: 20, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const weights = filtered.map(d => d.weightKg);
  const maxW = Math.max(...weights) + 1;
  const minW = Math.min(...weights) - 1;

  function xPos(i: number) { return PAD.left + (i / (filtered.length - 1)) * chartW; }
  function yPos(v: number) { return PAD.top + chartH - ((v - minW) / (maxW - minW)) * chartH; }

  const points = filtered.map((d, i) => `${xPos(i)},${yPos(d.weightKg)}`);
  const pathD = `M ${points.join(' L ')}`;
  const yTicks = [minW, (minW + maxW) / 2, maxW].map(v => Math.round(v * 10) / 10);
  const fmt = (d: string) => d.slice(5).replace('-', '/');

  const firstWeight = filtered[0].weightKg;
  const lastWeight = filtered[filtered.length - 1].weightKg;
  const delta = lastWeight - firstWeight;
  const deltaText = delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`;
  const deltaColor = delta < 0 ? Colors.success : delta > 0 ? '#ef4444' : Colors.textSecondary;

  return (
    <View>
      <View style={styles.deltaRow}>
        <Text variant="caption">{days}d change: </Text>
        <Text variant="caption" style={{ color: deltaColor, fontWeight: '700' }}>{deltaText}</Text>
        <Text variant="caption"> · Current: {lastWeight} kg</Text>
      </View>
      <Svg width={W} height={H}>
        {yTicks.map((v, i) => (
          <React.Fragment key={i}>
            <SvgText x={PAD.left - 4} y={yPos(v) + 4} fontSize={9} fill={Colors.textMuted} textAnchor="end">
              {v}
            </SvgText>
            <Line x1={PAD.left} y1={yPos(v)} x2={W - PAD.right} y2={yPos(v)}
              stroke={Colors.bgCardBorder} strokeWidth={1} />
          </React.Fragment>
        ))}
        <Path d={pathD} stroke={Colors.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {filtered.map((d, i) => (
          <Circle key={i} cx={xPos(i)} cy={yPos(d.weightKg)} r={3}
            fill={Colors.primary} />
        ))}
        <SvgText x={PAD.left} y={H - 3} fontSize={9} fill={Colors.textMuted} textAnchor="middle">
          {fmt(filtered[0].date)}
        </SvgText>
        <SvgText x={W - PAD.right} y={H - 3} fontSize={9} fill={Colors.textMuted} textAnchor="middle">
          {fmt(filtered[filtered.length - 1].date)}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { height: 80, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  deltaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, flexWrap: 'wrap' },
});
