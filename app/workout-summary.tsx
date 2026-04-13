import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { ShareCard } from '@/components/workout/ShareCard';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { formatDuration, formatVolume } from '@/lib/utils';
import { syncWorkoutSession } from '@/lib/workout-sync';
import { estimateWorkoutCalories, estimateSweatLossMl } from '@/lib/calorie-burn';
import { useTemplatesStore } from '@/stores/templates';
import { useWorkoutStore } from '@/stores/workout';
import { useAuthStore } from '@/stores/auth';
import { useNutritionStore } from '@/stores/nutrition';

const RPE_LABELS: Record<number, string> = {
  1: 'Very Easy', 2: 'Easy', 3: 'Light', 4: 'Moderate',
  5: 'Challenging', 6: 'Hard', 7: 'Very Hard', 8: 'Extremely Hard',
  9: 'Near Max', 10: 'Max Effort',
};

function RpeModal({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const { saveSessionRpe } = useWorkoutStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!selected) { onDone(); return; }
    setSaving(true);
    await saveSessionRpe(sessionId, selected).catch(() => {});
    setSaving(false);
    onDone();
  }

  return (
    <Modal transparent animationType="fade">
      <View style={rpeStyles.overlay}>
        <View style={rpeStyles.sheet}>
          <Text variant="heading" style={{ textAlign: 'center', marginBottom: 4 }}>How hard was that?</Text>
          <Text variant="caption" style={{ textAlign: 'center', marginBottom: Spacing.xs }}>
            Rate your overall effort from 1 (barely broke a sweat) to 10 (gave absolutely everything).
          </Text>
          <Text variant="caption" style={{ textAlign: 'center', color: Colors.primary, marginBottom: Spacing.lg }}>
            💡 Coach uses this to adjust your next workout — too easy → heavier weights, too hard → lighter load & more rest.
          </Text>
          <View style={rpeStyles.bubbleRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <TouchableOpacity
                key={n}
                style={[rpeStyles.bubble, selected === n && rpeStyles.bubbleSelected,
                  n >= 8 && { borderColor: Colors.secondary },
                  n >= 8 && selected === n && { backgroundColor: Colors.secondary },
                ]}
                onPress={() => setSelected(n)}
              >
                <Text style={[rpeStyles.bubbleText, selected === n && { color: '#fff' }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selected && (
            <Text variant="caption" style={{ textAlign: 'center', color: selected >= 8 ? Colors.secondary : Colors.primary, marginTop: Spacing.sm }}>
              {RPE_LABELS[selected]}
              {selected >= 8 ? ' — Coach will ease up next time 💪' : selected <= 4 ? ' — Coach will push you harder next time 🔥' : ' — Great effort, keep it up!'}
            </Text>
          )}
          <Button
            label={saving ? 'Saving…' : selected ? 'Save & Continue' : 'Skip'}
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </View>
    </Modal>
  );
}

const rpeStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40, gap: Spacing.sm },
  bubbleRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  bubble: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.bgCardBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  bubbleSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bubbleText: { fontSize: FontSize.base, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
});

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444', back: '#3b82f6', shoulders: '#a855f7',
  biceps: '#f59e0b', triceps: '#f97316', quads: '#22c55e',
  hamstrings: '#06b6d4', glutes: '#ec4899', calves: '#84cc16',
  abs: '#f97316', traps: '#6366f1',
};

export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams<{
    sessionId: string;
    durationSeconds: string;
    totalVolumeKg: string;
    setCount: string;
    prCount: string;
    musclesWorked: string;
    xpEarned: string;
    sessionName: string;
  }>();

  const { user, profile } = useAuthStore();
  const { saveTemplate } = useTemplatesStore();
  const { exercises: workoutExercises } = useWorkoutStore();
  const { setWorkoutBurn } = useNutritionStore();
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState(params.sessionName ?? 'My Workout');
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showRpe, setShowRpe] = useState(true);
  const shareCardRef = useRef<View>(null);

  async function handleShare() {
    if (!shareCardRef.current) return;
    setSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) { Alert.alert('Sharing not available on this device'); return; }
      const uri = await (shareCardRef.current as any).capture?.();
      if (!uri) { Alert.alert('Could not capture card'); return; }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your workout!' });
    } catch (e) {
      Alert.alert('Error', 'Could not share workout card.');
    } finally {
      setSharing(false);
    }
  }

  const duration = parseInt(params.durationSeconds ?? '0');
  const volume = parseFloat(params.totalVolumeKg ?? '0');
  const sets = parseInt(params.setCount ?? '0');
  const prs = parseInt(params.prCount ?? '0');
  const muscles = params.musclesWorked ? params.musclesWorked.split(',').filter(Boolean) : [];
  const xp = parseInt(params.xpEarned ?? '0');
  const caloriesBurned = estimateWorkoutCalories(duration, volume, profile?.bodyweightKg ?? 70);
  const { lostMl, drinkMl } = estimateSweatLossMl(duration, volume);

  // Sync to Supabase in background
  useEffect(() => {
    if (params.sessionId) {
      syncWorkoutSession(params.sessionId).catch(console.warn);
    }
    setWorkoutBurn(caloriesBurned);
  }, []);

  async function handleSaveTemplate() {
    if (!user) return;
    setSavingTemplate(true);
    try {
      const exerciseList = workoutExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets.filter(s => s.completed).length || ex.sets.length || 3,
        targetReps: ex.sets.find(s => s.completed)?.reps ?? ex.sets[0]?.reps ?? 10,
        targetWeightKg: Math.max(...ex.sets.filter(s => s.completed).map(s => s.weightKg), 0) || 0,
      }));
      if (exerciseList.length === 0) { Alert.alert('No exercises to save'); return; }
      await saveTemplate(user.id, templateName, exerciseList);
      Alert.alert('Saved!', `"${templateName}" saved as a template.`);
      setShowTemplateSave(false);
    } finally {
      setSavingTemplate(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {showRpe && params.sessionId && (
        <RpeModal sessionId={params.sessionId} onDone={() => setShowRpe(false)} />
      )}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <Text style={styles.heroIcon}>{prs > 0 ? '🏆' : '💪'}</Text>
        <Text variant="heading" style={styles.heroTitle}>
          {prs > 0 ? 'New Personal Records!' : 'Workout Complete!'}
        </Text>

        {/* XP earned */}
        <Card accent style={styles.xpCard}>
          <Text variant="label" color={Colors.primary}>⚡ XP EARNED</Text>
          <Text style={styles.xpValue}>+{xp} XP</Text>
        </Card>

        {/* Calorie burn card */}
        {caloriesBurned > 0 && (
          <Card style={styles.burnCard}>
            <Text variant="label" color={Colors.warning}>🔥 ESTIMATED BURN</Text>
            <Text style={styles.burnValue}>~{caloriesBurned} kcal</Text>
            <Text variant="caption">Based on {formatDuration(duration)} workout, {formatVolume(volume)}kg volume</Text>
          </Card>
        )}

        {/* Sweat / hydration card */}
        {drinkMl > 0 && (
          <Card style={styles.burnCard}>
            <Text variant="label" color={Colors.info}>💧 REHYDRATE NOW</Text>
            <Text style={[styles.burnValue, { color: Colors.info }]}>~{drinkMl} ml</Text>
            <Text variant="caption">
              Est. ~{lostMl} ml lost via sweat — drink ~{drinkMl} ml to fully rehydrate.
            </Text>
          </Card>
        )}

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Duration', value: formatDuration(duration) },
            { label: 'Volume', value: `${formatVolume(volume)} kg` },
            { label: 'Sets', value: String(sets) },
            { label: 'PRs', value: String(prs) },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text variant="heading" color={Colors.primary}>{s.value}</Text>
              <Text variant="label">{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Muscles worked */}
        {muscles.length > 0 && (
          <Card style={styles.musclesCard}>
            <Text variant="label" style={{ marginBottom: Spacing.md }}>Muscles Worked</Text>
            <View style={styles.muscleChips}>
              {muscles.map((m) => (
                <View key={m} style={[styles.muscleChip, { backgroundColor: (MUSCLE_COLORS[m] ?? Colors.primary) + '25', borderColor: MUSCLE_COLORS[m] ?? Colors.primary }]}>
                  <Text style={[styles.muscleChipText, { color: MUSCLE_COLORS[m] ?? Colors.primary }]}>
                    {m}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* PR callout */}
        {prs > 0 && (
          <Card accent style={styles.prCard}>
            <Text variant="label" color={Colors.primary}>🏆 PERSONAL RECORDS</Text>
            <Text variant="body" style={{ marginTop: Spacing.sm }}>
              You set {prs} new PR{prs > 1 ? 's' : ''} today. Keep pushing!
            </Text>
          </Card>
        )}

        {/* Share card (hidden, used for capture) */}
        <View style={styles.shareCardWrapper}>
          <ViewShot ref={shareCardRef as any} options={{ format: 'png', quality: 1.0 }}>
            <ShareCard
              username={profile?.username ?? 'athlete'}
              durationSeconds={duration}
              totalVolumeKg={volume}
              setCount={sets}
              prCount={prs}
              xpEarned={xp}
              muscles={muscles}
            />
          </ViewShot>
        </View>

        {/* Share button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          <Text style={styles.shareBtnText}>{sharing ? '⏳ Capturing...' : '📸 Share Workout Card'}</Text>
        </TouchableOpacity>

        {/* Save as Template */}
        {!showTemplateSave ? (
          <TouchableOpacity
            style={styles.templateBtn}
            onPress={() => setShowTemplateSave(true)}
          >
            <Text style={styles.templateBtnText}>📋 Save as Template</Text>
          </TouchableOpacity>
        ) : (
          <Card style={styles.templateCard}>
            <Text variant="label" style={{ marginBottom: Spacing.sm }}>Template Name</Text>
            <TextInput
              style={styles.templateInput}
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="My Workout"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.templateBtns}>
              <Button
                label={savingTemplate ? 'Saving...' : 'SAVE TEMPLATE'}
                onPress={handleSaveTemplate}
                loading={savingTemplate}
                style={{ flex: 1 }}
              />
              <Button
                label="Cancel"
                onPress={() => setShowTemplateSave(false)}
                variant="ghost"
              />
            </View>
          </Card>
        )}

        <Button label="Back to Home" onPress={() => router.replace('/(tabs)')} style={styles.homeBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, alignItems: 'center' },
  heroIcon: { fontSize: 72, marginTop: Spacing.xl },
  heroTitle: { textAlign: 'center' },
  xpCard: { width: '100%', alignItems: 'center', gap: Spacing.sm },
  xpValue: { fontSize: FontSize.display, fontWeight: FontWeight.heavy, color: Colors.primary },
  burnCard: { width: '100%', alignItems: 'center', gap: Spacing.sm },
  burnValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, color: Colors.warning },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, width: '100%' },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', gap: 4 },
  musclesCard: { width: '100%' },
  muscleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  muscleChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  muscleChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  prCard: { width: '100%' },
  homeBtn: { width: '100%', marginTop: Spacing.md },
  templateBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  templateBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold },
  templateCard: { gap: Spacing.md, width: '100%' },
  templateInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base,
  },
  templateBtns: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  shareCardWrapper: {
    // Position off-screen but still rendered so ViewShot can capture it
    position: 'absolute',
    top: -9999,
    left: 0,
    opacity: 0,
  },
  shareBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
    borderRadius: Radius.lg,
    width: '100%',
  },
  shareBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
});
