import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface Props {
  habitId: string;
  logs: { habitId: string; date: string; completed: boolean }[];
}

const CELL = 14;
const GAP = 2;
const COLS = 13; // ~13 weeks

export function HabitGrid({ habitId, logs }: Props) {
  const cells = useMemo(() => {
    const today = new Date();
    const days: { date: string; completed: boolean }[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = formatDate(d);
      const log = logs.find(l => l.habitId === habitId && l.date === date);
      days.push({ date, completed: log?.completed ?? false });
    }
    // Pad front so first cell aligns to Sunday
    const firstDay = new Date(days[0].date).getDay();
    const padded: ({ date: string; completed: boolean } | null)[] = [
      ...Array(firstDay).fill(null),
      ...days,
    ];
    return padded;
  }, [habitId, logs]);

  const today = formatDate(new Date());

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.grid}>
        {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, col) => (
          <View key={col} style={styles.col}>
            {cells.slice(col * 7, col * 7 + 7).map((cell, row) => {
              if (!cell) return <View key={row} style={styles.cellEmpty} />;
              const isToday = cell.date === today;
              return (
                <View
                  key={row}
                  style={[
                    styles.cell,
                    cell.completed ? styles.cellDone : styles.cellMiss,
                    isToday && styles.cellToday,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: GAP, paddingVertical: Spacing.xs },
  col: { flexDirection: 'column', gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 3 },
  cellEmpty: { width: CELL, height: CELL },
  cellDone: { backgroundColor: Colors.primary },
  cellMiss: { backgroundColor: Colors.bgCardBorder },
  cellToday: { borderWidth: 1.5, borderColor: Colors.primary },
});
