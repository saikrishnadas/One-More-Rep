import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface Props {
  // Map of 'YYYY-MM-DD' → number of workouts
  workoutDates: Record<string, number>;
}

const CELL = 13;
const GAP = 2;
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function WorkoutHeatmap({ workoutDates }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const days: { date: string; count: number }[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = formatDate(d);
      days.push({ date, count: workoutDates[date] ?? 0 });
    }
    // Pad front to align with Sunday
    const firstDow = new Date(days[0].date).getDay();
    const padded: ({ date: string; count: number } | null)[] = [
      ...Array(firstDow).fill(null),
      ...days,
    ];
    const cols = Math.ceil(padded.length / 7);
    const weeks: ({ date: string; count: number } | null)[][] = [];
    for (let c = 0; c < cols; c++) {
      weeks.push(padded.slice(c * 7, c * 7 + 7));
    }

    // Month labels: place at the first week of each month
    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const firstReal = week.find(c => c !== null);
      if (firstReal) {
        const m = new Date(firstReal.date).getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ col, label: MONTHS[m] });
          lastMonth = m;
        }
      }
    });

    return { weeks, monthLabels };
  }, [workoutDates]);

  function cellColor(count: number) {
    if (count === 0) return Colors.bgCardBorder;
    if (count === 1) return '#7c3003';
    if (count === 2) return '#c2410c';
    return Colors.primary;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        {/* Month labels */}
        <View style={styles.monthRow}>
          {monthLabels.map((m, i) => (
            <View key={i} style={[styles.monthLabel, { left: m.col * (CELL + GAP) }]}>
              <Text style={styles.monthText}>{m.label}</Text>
            </View>
          ))}
        </View>
        {/* Grid */}
        <View style={styles.grid}>
          {/* Day labels */}
          <View style={styles.dayLabels}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.dayLabel}>{i % 2 === 1 ? d : ''}</Text>
            ))}
          </View>
          {/* Weeks */}
          <View style={styles.weeks}>
            {weeks.map((week, col) => (
              <View key={col} style={styles.weekCol}>
                {week.map((cell, row) => (
                  <View
                    key={row}
                    style={[
                      styles.cell,
                      { backgroundColor: cell ? cellColor(cell.count) : 'transparent' },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  monthRow: { position: 'relative', height: 16, marginLeft: 20, marginBottom: 2 },
  monthLabel: { position: 'absolute' },
  monthText: { fontSize: FontSize.xs, color: Colors.textMuted },
  grid: { flexDirection: 'row' },
  dayLabels: { width: 18, gap: GAP },
  dayLabel: { height: CELL, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', lineHeight: CELL },
  weeks: { flexDirection: 'row', gap: GAP },
  weekCol: { flexDirection: 'column', gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2 },
});
