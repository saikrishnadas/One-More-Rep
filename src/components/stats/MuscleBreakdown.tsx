import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#f97316', back: '#3b82f6', shoulders: '#a855f7',
  biceps: '#22c55e', triceps: '#ef4444', legs: '#f59e0b',
  core: '#06b6d4', glutes: '#ec4899', calves: '#84cc16',
  forearms: '#8b5cf6', traps: '#14b8a6', lats: '#6366f1',
};

interface Props {
  muscleCounts: Record<string, number>; // muscle → set count
}

export function MuscleBreakdown({ muscleCounts }: Props) {
  const entries = Object.entries(muscleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxCount = Math.max(...entries.map(e => e[1]), 1);

  if (entries.length === 0) {
    return <Text variant="caption" style={{ textAlign: 'center', marginVertical: Spacing.md }}>No data yet</Text>;
  }

  return (
    <View style={styles.container}>
      {entries.map(([muscle, count]) => {
        const pct = count / maxCount;
        const color = MUSCLE_COLORS[muscle] ?? Colors.primary;
        return (
          <View key={muscle} style={styles.row}>
            <Text style={styles.muscleLabel}>{muscle}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={styles.count}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  muscleLabel: { width: 80, fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.bgCardBorder, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.full },
  count: { width: 30, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
});
