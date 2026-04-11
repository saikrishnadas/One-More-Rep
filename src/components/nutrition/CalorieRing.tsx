import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { Colors, FontSize, FontWeight } from '@/lib/constants';

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

export function CalorieRing({ consumed, goal, size = 160 }: CalorieRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.bgCardBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? Colors.secondary : Colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.inner}>
        <Text style={styles.consumed}>{Math.round(consumed)}</Text>
        <Text style={styles.label}>kcal</Text>
        <Text style={[styles.remaining, isOver && { color: Colors.secondary }]}>
          {isOver ? `+${Math.round(consumed - goal)} over` : `${Math.round(remaining)} left`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  inner: { alignItems: 'center' },
  consumed: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  remaining: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
});
