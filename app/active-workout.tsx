import React, { useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useWorkoutStore } from '@/stores/workout';
import { useAuthStore } from '@/stores/auth';
import { ExerciseBlock } from '@/components/workout/ExerciseBlock';
import { ExerciseSearchModal } from '@/components/workout/ExerciseSearchModal';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize, FontWeight } from '@/lib/constants';
import { formatDuration, calculateWorkoutXp } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

export default function ActiveWorkoutScreen() {
  const {
    isActive, startWorkout, exercises, elapsedSeconds,
    addExercise, removeExercise, addSet,
    updateSet, completeSet, uncompleteSet,
    finishWorkout, discardWorkout, tick,
  } = useWorkoutStore();
  const { user } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start workout on mount if not already active
  useEffect(() => {
    if (!isActive) startWorkout();
  }, []);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => tick(), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const totalVolume = exercises
    .flatMap((e) => e.sets.filter((s) => s.completed))
    .reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  const completedSetCount = exercises.flatMap((e) => e.sets.filter((s) => s.completed)).length;

  async function handleFinish() {
    if (completedSetCount === 0) {
      Alert.alert('No sets logged', 'Complete at least one set before finishing.');
      return;
    }
    Alert.alert('Finish Workout?', 'This will save your session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          setFinishing(true);
          try {
            const summary = await finishWorkout(user!.id);
            const xp = calculateWorkoutXp(summary.totalVolumeKg, summary.prCount);
            router.replace({
              pathname: '/workout-summary',
              params: {
                sessionId: summary.sessionId,
                durationSeconds: String(summary.durationSeconds),
                totalVolumeKg: String(summary.totalVolumeKg),
                setCount: String(summary.setCount),
                prCount: String(summary.prCount),
                musclesWorked: summary.musclesWorked.join(','),
                xpEarned: String(xp),
              },
            });
          } catch (e) {
            Alert.alert('Error', 'Failed to save workout.');
          } finally {
            setFinishing(false);
          }
        },
      },
    ]);
  }

  function handleDiscard() {
    Alert.alert('Discard Workout?', 'All progress will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { discardWorkout(); router.back(); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Text style={styles.discardBtn}>✕</Text>
        </TouchableOpacity>
        <View style={styles.timerBlock}>
          <Text style={styles.timer}>{formatDuration(elapsedSeconds)}</Text>
          <Text variant="caption">{Math.round(totalVolume)} kg total</Text>
        </View>
        <Button
          label="Finish"
          onPress={handleFinish}
          loading={finishing}
          variant="primary"
          style={styles.finishBtn}
        />
      </View>

      {/* Exercise list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {exercises.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💪</Text>
            <Text variant="title" style={styles.emptyTitle}>No exercises yet</Text>
            <Text variant="caption">Tap the button below to add your first exercise</Text>
          </View>
        )}

        {exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.exerciseId}
            exercise={exercise}
            onAddSet={() => { addSet(exercise.exerciseId); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            onRemove={() => removeExercise(exercise.exerciseId)}
            onWeightChange={(setId, v) => updateSet(exercise.exerciseId, setId, 'weightKg', v)}
            onRepsChange={(setId, v) => updateSet(exercise.exerciseId, setId, 'reps', v)}
            onCompleteSet={(setId) => { completeSet(exercise.exerciseId, setId); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            onUncompleteSet={(setId) => uncompleteSet(exercise.exerciseId, setId)}
          />
        ))}

        {/* Add Exercise button */}
        <Button
          label="+ Add Exercise"
          onPress={() => setShowSearch(true)}
          variant="secondary"
          style={styles.addExBtn}
        />
      </ScrollView>

      <ExerciseSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={(ex) => { addExercise(ex); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgCardBorder,
  },
  discardBtn: { fontSize: 20, color: Colors.textSecondary, padding: 4 },
  timerBlock: { alignItems: 'center' },
  timer: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  finishBtn: { paddingVertical: 10, paddingHorizontal: Spacing.lg },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 80 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { marginTop: Spacing.md },
  addExBtn: { marginTop: Spacing.md },
});
