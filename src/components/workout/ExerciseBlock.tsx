import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { SetRow } from './SetRow';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import type { ActiveExercise } from '@/stores/workout';

interface ExerciseBlockProps {
  exercise: ActiveExercise;
  onAddSet: () => void;
  onRemove: () => void;
  onWeightChange: (setId: string, value: number) => void;
  onRepsChange: (setId: string, value: number) => void;
  onCompleteSet: (setId: string) => void;
  onUncompleteSet: (setId: string) => void;
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444', back: '#3b82f6', shoulders: '#a855f7',
  biceps: '#f59e0b', triceps: '#f97316', quads: '#22c55e',
  hamstrings: '#06b6d4', glutes: '#ec4899', calves: '#84cc16',
  abs: '#f97316', traps: '#6366f1',
};

export function ExerciseBlock({
  exercise, onAddSet, onRemove,
  onWeightChange, onRepsChange, onCompleteSet, onUncompleteSet,
}: ExerciseBlockProps) {
  const muscleColor = MUSCLE_COLORS[exercise.primaryMuscle] ?? Colors.primary;
  const completedCount = exercise.sets.filter((s) => s.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.muscleDot, { backgroundColor: muscleColor }]} />
        <View style={styles.titleBlock}>
          <Text variant="title">{exercise.exerciseName}</Text>
          <Text variant="caption" style={{ color: muscleColor }}>
            {exercise.primaryMuscle} · {completedCount}/{exercise.sets.length} sets
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.colHeaders}>
        <Text style={[styles.colLabel, { width: 24 }]}>#</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Weight</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Reps</Text>
        <Text style={[styles.colLabel, { width: 36 }]}></Text>
      </View>

      {exercise.sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          onWeightChange={(v) => onWeightChange(set.id, v)}
          onRepsChange={(v) => onRepsChange(set.id, v)}
          onComplete={() => onCompleteSet(set.id)}
          onUncomplete={() => onUncompleteSet(set.id)}
        />
      ))}

      <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  muscleDot: { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  titleBlock: { flex: 1 },
  removeBtn: { padding: 4 },
  removeIcon: { fontSize: FontSize.sm, color: Colors.textMuted },
  colHeaders: { flexDirection: 'row', marginBottom: 4, gap: Spacing.sm },
  colLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  addSetBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
  },
  addSetText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold },
});
