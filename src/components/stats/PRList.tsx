import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

export interface PRRecord {
  exerciseName: string;
  weightKg: number;
  reps: number;
  date: string;
}

interface Props {
  records: PRRecord[];
}

export function PRList({ records }: Props) {
  if (records.length === 0) {
    return <Text variant="caption" style={{ textAlign: 'center', marginVertical: Spacing.md }}>No PRs yet — keep lifting!</Text>;
  }

  return (
    <View style={styles.container}>
      {records.map((pr, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.rank}>
            <Text style={styles.rankText}>{i + 1}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.exerciseName}>{pr.exerciseName}</Text>
            <Text variant="caption">{pr.date}</Text>
          </View>
          <View style={styles.weight}>
            <Text style={styles.weightText}>{pr.weightKg} kg</Text>
            <Text variant="caption">× {pr.reps}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rank: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: FontSize.sm, fontWeight: FontWeight.heavy, color: Colors.primary },
  info: { flex: 1 },
  exerciseName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  weight: { alignItems: 'flex-end' },
  weightText: { fontSize: FontSize.lg, fontWeight: FontWeight.heavy, color: Colors.primary },
});
