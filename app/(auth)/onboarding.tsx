import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

type Goal = 'lose_weight' | 'build_muscle' | 'improve_fitness' | 'powerlifting';
type Days = 3 | 4 | 5 | 6;

const GOALS: { key: Goal; label: string; icon: string }[] = [
  { key: 'lose_weight',     label: 'Lose Weight',       icon: '🔥' },
  { key: 'build_muscle',    label: 'Build Muscle',       icon: '💪' },
  { key: 'improve_fitness', label: 'Improve Fitness',    icon: '🏃' },
  { key: 'powerlifting',    label: 'Powerlifting',       icon: '🏋️' },
];

export default function OnboardingScreen() {
  const { user, fetchProfile } = useAuthStore();
  const [bodyweight, setBodyweight] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [trainingDays, setTrainingDays] = useState<Days>(4);
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (!goal) { Alert.alert('Pick a goal to continue'); return; }
    setLoading(true);
    await supabase.from('profiles').update({
      bodyweight_kg: bodyweight ? parseFloat(bodyweight) : null,
      goal,
      training_days_per_week: trainingDays,
    }).eq('id', user!.id);
    await fetchProfile();
    setLoading(false);
    router.replace('/(tabs)');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>Let's set you up 🔥</Text>

      <Text variant="label" style={styles.sectionLabel}>Your Goal</Text>
      <View style={styles.goalGrid}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[styles.goalCard, goal === g.key && styles.goalCardActive]}
            onPress={() => setGoal(g.key)}
          >
            <Text style={styles.goalIcon}>{g.icon}</Text>
            <Text variant="caption" style={goal === g.key ? { color: Colors.primary, fontWeight: FontWeight.bold } : {}}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text variant="label" style={styles.sectionLabel}>Bodyweight (kg)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 75"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numeric"
        value={bodyweight}
        onChangeText={setBodyweight}
      />

      <Text variant="label" style={styles.sectionLabel}>Training Days Per Week</Text>
      <View style={styles.daysRow}>
        {([3, 4, 5, 6] as Days[]).map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.dayBtn, trainingDays === d && styles.dayBtnActive]}
            onPress={() => setTrainingDays(d)}
          >
            <Text style={[styles.dayText, trainingDays === d && { color: Colors.primary }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button label="LET'S GO 🔥" onPress={handleFinish} loading={loading} style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xxl, paddingTop: 64 },
  title: { marginBottom: Spacing.xxxl, textAlign: 'center' },
  sectionLabel: { marginBottom: Spacing.sm, marginTop: Spacing.xl },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  goalCard: {
    width: '47%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  goalCardActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  goalIcon: { fontSize: 28 },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  daysRow: { flexDirection: 'row', gap: Spacing.sm },
  dayBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: Spacing.md,
    alignItems: 'center',
  },
  dayBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  dayText: { fontSize: FontSize.lg, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  btn: { marginTop: Spacing.xxxl },
});
