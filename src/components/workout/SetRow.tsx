import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Check } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import type { ActiveSet } from '@/stores/workout';
import { useRestTimerStore } from '@/stores/restTimer';

interface SetRowProps {
  set: ActiveSet;
  exerciseName: string;
  onWeightChange: (value: number) => void;
  onRepsChange: (value: number) => void;
  onComplete: () => void;
  onUncomplete: () => void;
  onRpeChange?: (rpe: number | null) => void;
}

export function SetRow({ set, exerciseName, onWeightChange, onRepsChange, onComplete, onUncomplete, onRpeChange }: SetRowProps) {
  const startRestTimer = useRestTimerStore((s) => s.start);
  return (
    <View>
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
          onPress={() => {
            if (set.completed) {
              onUncomplete();
            } else {
              onComplete();
              startRestTimer(90, exerciseName);
            }
          }}
          activeOpacity={0.7}
        >
          {set.completed && <Check size={18} color={Colors.success} />}
        </TouchableOpacity>
      </View>

      {set.completed && (
        <View style={styles.rpeRow}>
          <Text style={styles.rpeLabel}>RPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rpeBubbles}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.rpeBubble, set.rpe === n && styles.rpeBubbleSelected]}
                onPress={() => onRpeChange?.(set.rpe === n ? null : n)}
              >
                <Text style={[styles.rpeBubbleText, set.rpe === n && styles.rpeBubbleTextSelected]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
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
rpeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: Spacing.sm },
  rpeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold },
  rpeBubbles: { flexGrow: 0 },
  rpeBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  rpeBubbleSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rpeBubbleText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  rpeBubbleTextSelected: { color: '#fff', fontWeight: FontWeight.bold },
});
