import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize } from '@/lib/constants';

export interface OneRMDataPoint {
  date: string;         // 'YYYY-MM-DD'
  estimated1RM: number; // kg
  isPR: boolean;
}

interface Props {
  data: OneRMDataPoint[];
  exerciseName: string;
}

const W = 320;
const H = 160;
const PAD = { top: 16, right: 16, bottom: 24, left: 40 };

export function OneRMChart({ data, exerciseName }: Props) {
  if (data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text variant="caption">
          Log {2 - data.length} more session{data.length === 0 ? 's' : ''} to see your progress
        </Text>
      </View>
    );
  }

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxRM = Math.max(...data.map((d) => d.estimated1RM)) * 1.1;
  const minRM = Math.min(...data.map((d) => d.estimated1RM)) * 0.9;

  function xPos(i: number): number {
    return PAD.left + (i / (data.length - 1)) * chartW;
  }

  function yPos(v: number): number {
    return PAD.top + chartH - ((v - minRM) / (maxRM - minRM)) * chartH;
  }

  const points = data.map((d, i) => `${xPos(i)},${yPos(d.estimated1RM)}`);
  const pathD = `M ${points.join(' L ')}`;

  const yTicks = [minRM, (minRM + maxRM) / 2, maxRM].map((v) => Math.round(v));

  const fmt = (d: string) => d.slice(5).replace('-', '/'); // 'MM/DD'

  return (
    <View style={styles.container}>
      <Svg width={W} height={H}>
        {/* Y-axis tick labels */}
        {yTicks.map((v, i) => (
          <SvgText
            key={i}
            x={PAD.left - 6}
            y={yPos(v) + 4}
            fontSize={FontSize.xs}
            fill={Colors.textMuted}
            textAnchor="end"
          >
            {v}
          </SvgText>
        ))}

        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <Line
            key={i}
            x1={PAD.left}
            y1={yPos(v)}
            x2={W - PAD.right}
            y2={yPos(v)}
            stroke={Colors.bgCardBorder}
            strokeWidth={1}
          />
        ))}

        {/* Line path */}
        <Path
          d={pathD}
          stroke={Colors.primary}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data point dots */}
        {data.map((d, i) => (
          <Circle
            key={i}
            cx={xPos(i)}
            cy={yPos(d.estimated1RM)}
            r={d.isPR ? 6 : 3.5}
            fill={d.isPR ? Colors.primary : Colors.bgCard}
            stroke={Colors.primary}
            strokeWidth={2}
          />
        ))}

        {/* X-axis first label */}
        <SvgText
          x={PAD.left}
          y={H - 4}
          fontSize={FontSize.xs}
          fill={Colors.textMuted}
          textAnchor="middle"
        >
          {fmt(data[0].date)}
        </SvgText>

        {/* X-axis last label */}
        <SvgText
          x={W - PAD.right}
          y={H - 4}
          fontSize={FontSize.xs}
          fill={Colors.textMuted}
          textAnchor="middle"
        >
          {fmt(data[data.length - 1].date)}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  empty: { height: 80, justifyContent: 'center', alignItems: 'center' },
});
