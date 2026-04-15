import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { X, Flame } from 'lucide-react-native';
import { SetRow } from './SetRow';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import type { ActiveExercise } from '@/stores/workout';
import { useWorkoutStore } from '@/stores/workout';
import { getSuggestion, OverloadSuggestion, applyReadinessAdjustment } from '@/lib/progressive-overload';
import { useAuthStore } from '@/stores/auth';
import { useHealthPlatformStore } from '@/stores/healthPlatform';
import { useSubscriptionStore } from '@/stores/subscription';
import { router } from 'expo-router';
import type { RecoveryStatus } from '@/lib/muscle-recovery';
import { getWarmupSets } from '@/lib/warmup-calculator';

const RECOVERY_DOT_COLOR: Record<RecoveryStatus, string> = {
  fresh:      Colors.success,
  recovering: Colors.warning,
  fatigued:   Colors.secondary,
};

interface ExerciseBlockProps {
  exercise: ActiveExercise;
  onAddSet: () => void;
  onRemove: () => void;
  onRemoveSet: (setId: string) => void;
  onWeightChange: (setId: string, value: number) => void;
  onRepsChange: (setId: string, value: number) => void;
  onCompleteSet: (setId: string) => void;
  onUncompleteSet: (setId: string) => void;
  onRpeChange: (setId: string, rpe: number | null) => void;
  recoveryStatus?: RecoveryStatus;
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444', back: '#3b82f6', shoulders: '#a855f7',
  biceps: '#f59e0b', triceps: '#f97316', quads: '#22c55e',
  hamstrings: '#06b6d4', glutes: '#ec4899', calves: '#84cc16',
  abs: '#f97316', traps: '#6366f1',
};

export function ExerciseBlock({
  exercise, onAddSet, onRemove, onRemoveSet,
  onWeightChange, onRepsChange, onCompleteSet, onUncompleteSet, onRpeChange,
  recoveryStatus,
}: ExerciseBlockProps) {
  const muscleColor = MUSCLE_COLORS[exercise.primaryMuscle] ?? Colors.primary;
  const completedCount = exercise.sets.filter((s) => s.completed).length;
  const [suggestion, setSuggestion] = useState<OverloadSuggestion | null>(null);
  const { user } = useAuthStore();
  const { addWarmupSets } = useWorkoutStore();

  const hasWarmups = exercise.sets.some((s) => (s as any).isWarmup);
  const hasWorkingSets = exercise.sets.some((s) => s.weightKg > 0);

  useEffect(() => {
    if (!user || !exercise.exerciseId) return;
    getSuggestion(exercise.exerciseId, user.id).then(setSuggestion);
  }, [exercise.exerciseId, user?.id]);

  const readinessScore = useHealthPlatformStore((s) => s.readinessScore);
  const isPro = useSubscriptionStore((s) => s.isPro);

  const displaySuggestion = useMemo(() => {
    if (!suggestion) return null;
    if (isPro && readinessScore !== null) {
      return applyReadinessAdjustment(suggestion, readinessScore);
    }
    return suggestion;
  }, [suggestion, isPro, readinessScore]);

  function handleAddWarmups() {
    const targetWeight = exercise.sets.find((s) => s.weightKg > 0)?.weightKg ?? 0;
    if (!targetWeight) return;
    const warmups = getWarmupSets(targetWeight);
    addWarmupSets(exercise.exerciseId, warmups);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.muscleDot, { backgroundColor: muscleColor }]} />
        {recoveryStatus !== undefined && (
          <View
            style={[
              styles.recoveryDot,
              { backgroundColor: RECOVERY_DOT_COLOR[recoveryStatus] },
            ]}
          />
        )}
        <View style={styles.titleBlock}>
          <Text variant="title">{exercise.exerciseName}</Text>
          <Text variant="caption" style={{ color: muscleColor }}>
            {exercise.primaryMuscle} · {completedCount}/{exercise.sets.length} sets
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
          <X size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {suggestion && (
        <View style={styles.suggestionChip}>
          <Text style={styles.suggestionText}>
            {'\u{1F4A1}'} {displaySuggestion!.message}
            {suggestion.lastDate
              ? ` \u00b7 was ${suggestion.lastWeightKg}kg \u00d7 ${suggestion.lastReps} (${suggestion.lastDate})`
              : ''}
          </Text>
        </View>
      )}

      {suggestion && !isPro && readinessScore !== null && (
        <TouchableOpacity
          style={styles.proHint}
          onPress={() => router.push('/paywall' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.proHintText}>
            🔒 PRO: Adjust for your readiness ({readinessScore}/100)
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.colHeaders}>
        <Text style={[styles.colLabel, { width: 24 }]}>#</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Weight</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Reps</Text>
        <Text style={[styles.colLabel, { width: 36 }]}>{/* check */}</Text>
        <Text style={[styles.colLabel, { width: 22 }]}>{/* del */}</Text>
      </View>

      {exercise.sets.map((set) => (
        <View key={set.id}>
          {(set as any).isWarmup && (
            <Text style={styles.warmupTag}>WARM-UP</Text>
          )}
          <SetRow
            set={set}
            exerciseName={exercise.exerciseName}
            onWeightChange={(v) => onWeightChange(set.id, v)}
            onRepsChange={(v) => onRepsChange(set.id, v)}
            onComplete={() => onCompleteSet(set.id)}
            onUncomplete={() => onUncompleteSet(set.id)}
            onRpeChange={(rpe) => onRpeChange(set.id, rpe)}
            onRemove={exercise.sets.length > 1 ? () => onRemoveSet(set.id) : undefined}
          />
        </View>
      ))}

      {!hasWarmups && hasWorkingSets && (
        <TouchableOpacity style={styles.warmupBtn} onPress={handleAddWarmups}>
          <Flame size={14} color={Colors.warning} />
          <Text style={styles.warmupBtnText}>Add Warm-ups</Text>
        </TouchableOpacity>
      )}

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
  recoveryDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  titleBlock: { flex: 1 },
  removeBtn: { padding: 4 },
  suggestionChip: {
    backgroundColor: Colors.bgHighlight,
    borderColor: Colors.primary + '40',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  colHeaders: { flexDirection: 'row', marginBottom: 4, gap: Spacing.sm },
  colLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  warmupTag: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.bold, marginBottom: 2 },
  warmupBtn: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.warning + '60',
    borderRadius: Radius.md,
    borderStyle: 'dashed',
  },
  warmupBtnText: { fontSize: FontSize.sm, color: Colors.warning, fontWeight: FontWeight.bold },
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
  proHint: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  proHintText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
