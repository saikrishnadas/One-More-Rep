import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Check, Trash2 } from 'lucide-react-native';
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
  onRemove?: () => void;
}

export function SetRow({ set, exerciseName, onWeightChange, onRepsChange, onComplete, onUncomplete, onRpeChange, onRemove }: SetRowProps) {
  const startRestTimer = useRestTimerStore((s) => s.start);
  return (
    <View>
      <View style={[styles.row, set.completed && styles.completedRow]}>
        <Text style={styles.setNum}>{set.setNumber < 0 ? 'W' : set.setNumber}</Text>

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

        {onRemove && !set.completed && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() =>
              Alert.alert('Delete Set', `Remove set ${set.setNumber < 0 ? 'warm-up' : set.setNumber}?`, [
                { text: 'Delete', style: 'destructive', onPress: onRemove },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            hitSlop={8}
          >
            <Trash2 size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {set.completed && (
        <View style={styles.rpeSection}>
          <View style={styles.rpeHeader}>
            <Text style={styles.rpeLabel}>How hard was this set?</Text>
            <Text style={styles.rpeHint}>Coach uses this to adjust your next workout</Text>
          </View>
          <View style={styles.rpeScaleLabels}>
            <Text style={styles.rpeScaleText}>Easy</Text>
            <Text style={styles.rpeScaleText}>Max effort</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rpeBubbles}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.rpeBubble,
                  set.rpe === n && styles.rpeBubbleSelected,
                  n >= 8 && set.rpe === n && styles.rpeBubbleHard,
                ]}
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
  deleteBtn: { padding: 4, marginLeft: 2 },
  rpeSection: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.bgCardBorder + '60' },
  rpeHeader: { marginBottom: 4 },
  rpeLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.bold },
  rpeHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  rpeScaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rpeScaleText: { fontSize: 9, color: Colors.textMuted },
  rpeBubbles: { flexGrow: 0 },
  rpeBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  rpeBubbleSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rpeBubbleHard: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  rpeBubbleText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  rpeBubbleTextSelected: { color: '#fff', fontWeight: FontWeight.bold },
});
