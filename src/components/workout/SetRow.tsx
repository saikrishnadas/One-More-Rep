import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import type { ActiveSet } from '@/stores/workout';

interface SetRowProps {
  set: ActiveSet;
  onWeightChange: (value: number) => void;
  onRepsChange: (value: number) => void;
  onComplete: () => void;
  onUncomplete: () => void;
}

export function SetRow({ set, onWeightChange, onRepsChange, onComplete, onUncomplete }: SetRowProps) {
  return (
    <View style={[styles.row, set.completed && styles.completedRow]}>
      <Text style={styles.setNum}>{set.setNumber}</Text>

      {set.isPr && <Text style={styles.prBadge}>PR</Text>}

      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, set.completed && styles.inputCompleted]}
          value={set.weightKg > 0 ? String(set.weightKg) : ''}
          onChangeText={(v) => onWeightChange(parseFloat(v) || 0)}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          editable={!set.completed}
        />
        <Text style={styles.unit}>kg</Text>
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, set.completed && styles.inputCompleted]}
          value={set.reps > 0 ? String(set.reps) : ''}
          onChangeText={(v) => onRepsChange(parseInt(v) || 0)}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          editable={!set.completed}
        />
        <Text style={styles.unit}>reps</Text>
      </View>

      <TouchableOpacity
        style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
        onPress={set.completed ? onUncomplete : onComplete}
        activeOpacity={0.7}
      >
        <Text style={styles.checkIcon}>{set.completed ? '✓' : '○'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  completedRow: { opacity: 0.75 },
  setNum: {
    width: 24,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  prBadge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.heavy,
    color: Colors.primary,
    backgroundColor: Colors.bgHighlight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    width: 56,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    textAlign: 'center',
  },
  inputCompleted: { borderColor: Colors.success + '60' },
  unit: { fontSize: FontSize.xs, color: Colors.textMuted },
  checkBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: { borderColor: Colors.success, backgroundColor: Colors.success + '20' },
  checkIcon: { fontSize: FontSize.lg, color: Colors.textPrimary },
});
