import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useOnboardingStore } from '@/stores/onboarding';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { ChevronLeft } from 'lucide-react-native';

const GOALS = [
  { key: 'lose_weight', label: 'Lose Weight' },
  { key: 'build_muscle', label: 'Build Muscle' },
  { key: 'improve_fitness', label: 'Get Fit' },
  { key: 'powerlifting', label: 'Powerlifting' },
  { key: 'stay_active', label: 'Stay Active' },
];

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];
const DIET_TYPES = ['any', 'non_veg', 'veg', 'vegan', 'keto'];
const DIET_LABELS: Record<string, string> = {
  any: 'No Preference', non_veg: 'Non-Veg', veg: 'Vegetarian', vegan: 'Vegan', keto: 'Keto',
};

export default function ProfileSettingsScreen() {
  const { profile, updateProfile, user } = useAuthStore();
  const { data: onboardingData, update: updateOnboarding, save: saveOnboarding } = useOnboardingStore();

  const [username, setUsername] = useState(profile?.username ?? '');
  const [weight, setWeight] = useState(onboardingData?.weightKg ?? String(profile?.bodyweightKg ?? ''));
  const [goal, setGoal] = useState(profile?.goal ?? onboardingData?.goal ?? 'build_muscle');
  const [trainingDays, setTrainingDays] = useState(String(profile?.trainingDaysPerWeek ?? onboardingData?.trainingDaysPerWeek ?? 4));
  const [fitnessLevel, setFitnessLevel] = useState(onboardingData?.fitnessLevel ?? 'intermediate');
  const [dietType, setDietType] = useState(onboardingData?.dietType ?? 'any');
  const [age, setAge] = useState(onboardingData?.age ?? '');
  const [heightCm, setHeightCm] = useState(onboardingData?.heightCm ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({
        username: username.trim() || profile?.username,
        goal,
        trainingDaysPerWeek: parseInt(trainingDays) || 4,
      });
      updateOnboarding({
        weightKg: weight,
        fitnessLevel: fitnessLevel as any,
        dietType: dietType as any,
        age,
        heightCm,
        goal: goal as any,
        trainingDaysPerWeek: parseInt(trainingDays) || 4,
      });
      await saveOnboarding(user.id);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function Field({ label, value, onChangeText, keyboardType = 'default', unit }: {
    label: string; value: string; onChangeText: (v: string) => void; keyboardType?: any; unit?: string;
  }) {
    return (
      <View style={styles.fieldGroup}>
        <Text variant="label" style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldRow}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholderTextColor={Colors.textMuted}
          />
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
      </View>
    );
  }

  function ChipRow({ options, value, onSelect }: { options: { key: string; label: string }[]; value: string; onSelect: (k: string) => void }) {
    return (
      <View style={styles.chipRow}>
        {options.map(o => (
          <TouchableOpacity
            key={o.key}
            style={[styles.chip, o.key === value && styles.chipActive]}
            onPress={() => onSelect(o.key)}
          >
            <Text style={[styles.chipText, o.key === value && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text variant="heading" style={{ flex: 1, textAlign: 'center' }}>Profile Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.section}>
          <Text variant="title" style={styles.sectionTitle}>Identity</Text>
          <Field label="Username" value={username} onChangeText={setUsername} />
          <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" unit="yrs" />
          <Field label="Height" value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" unit="cm" />
          <Field label="Body Weight" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" unit="kg" />
        </Card>

        <Card style={styles.section}>
          <Text variant="title" style={styles.sectionTitle}>Training</Text>
          <Text variant="label" style={styles.fieldLabel}>Goal</Text>
          <ChipRow options={GOALS} value={goal} onSelect={setGoal} />
          <Text variant="label" style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Fitness Level</Text>
          <ChipRow
            options={FITNESS_LEVELS.map(l => ({ key: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))}
            value={fitnessLevel as string}
            onSelect={setFitnessLevel}
          />
          <Text variant="label" style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Training Days / Week</Text>
          <ChipRow
            options={[3, 4, 5, 6].map(d => ({ key: String(d), label: `${d}x` }))}
            value={String(trainingDays)}
            onSelect={setTrainingDays}
          />
        </Card>

        <Card style={styles.section}>
          <Text variant="title" style={styles.sectionTitle}>Nutrition</Text>
          <Text variant="label" style={styles.fieldLabel}>Diet Type</Text>
          <ChipRow
            options={DIET_TYPES.map(d => ({ key: d, label: DIET_LABELS[d] }))}
            value={dietType}
            onSelect={setDietType}
          />
        </Card>

        <Button label={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} />
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40 },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  section: { gap: Spacing.md },
  sectionTitle: { marginBottom: Spacing.xs },
  fieldGroup: { gap: 4 },
  fieldLabel: { marginBottom: 4 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: {
    flex: 1, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base,
  },
  unit: { fontSize: FontSize.sm, color: Colors.textMuted, width: 32 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
  },
  chipActive: { backgroundColor: Colors.bgHighlight, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
});
