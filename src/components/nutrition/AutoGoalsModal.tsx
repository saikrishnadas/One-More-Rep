import React, { useState, useMemo } from 'react';
import {
  View, Modal, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (goals: { calories: number; proteinG: number; carbsG: number; fatG: number }) => void;
}

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'lose' | 'maintain' | 'gain';

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Lose',
  maintain: 'Maintain',
  gain: 'Gain',
};

const GOAL_OFFSETS: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function AutoGoalsModal({ visible, onClose, onApply }: Props) {
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [bodyFat, setBodyFat] = useState('');

  const calculated = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    if (!w || !h || !a) return null;

    const bmr =
      gender === 'male'
        ? 10 * w + 6.25 * h - 5 * a + 5
        : 10 * w + 6.25 * h - 5 * a - 161;

    const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
    const targetCalories = Math.round(tdee + GOAL_OFFSETS[goal]);

    const bfPct = parseFloat(bodyFat);
    const leanMass = bfPct > 0 && bfPct < 100 ? w * (1 - bfPct / 100) : w;
    const protein = Math.round(2 * leanMass);
    const fat = Math.round((targetCalories * 0.25) / 9);
    const carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);

    const bmi = w / ((h / 100) * (h / 100));

    return {
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calories: targetCalories,
      proteinG: protein,
      carbsG: Math.max(0, carbs),
      fatG: fat,
    };
  }, [gender, age, weight, height, activityLevel, goal, bodyFat]);

  function handleApply() {
    if (!calculated) return;
    onApply({
      calories: calculated.calories,
      proteinG: calculated.proteinG,
      carbsG: calculated.carbsG,
      fatG: calculated.fatG,
    });
    onClose();
  }

  function handleClose() {
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="title">Auto Goals</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {/* Gender */}
          <Text variant="label" style={styles.fieldLabel}>Gender</Text>
          <View style={styles.toggleRow}>
            {(['male', 'female'] as Gender[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.toggleBtn, gender === g && styles.toggleBtnActive]}
                onPress={() => setGender(g)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, gender === g && styles.toggleBtnTextActive]}>
                  {g === 'male' ? 'Male' : 'Female'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Age / Weight / Height row */}
          <View style={styles.row3}>
            <View style={styles.thirdField}>
              <Text variant="label" style={styles.fieldLabel}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
            </View>
            <View style={styles.thirdField}>
              <Text variant="label" style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="75"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
            <View style={styles.thirdField}>
              <Text variant="label" style={styles.fieldLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="175"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={height}
                onChangeText={setHeight}
              />
            </View>
          </View>

          {/* Activity Level */}
          <Text variant="label" style={styles.fieldLabel}>Activity Level</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activityScroll}
            contentContainerStyle={styles.activityScrollContent}
          >
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.toggleBtn, activityLevel === level && styles.toggleBtnActive]}
                onPress={() => setActivityLevel(level)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, activityLevel === level && styles.toggleBtnTextActive]}>
                  {ACTIVITY_LABELS[level]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Goal */}
          <Text variant="label" style={styles.fieldLabel}>Goal</Text>
          <View style={styles.toggleRow}>
            {(['lose', 'maintain', 'gain'] as Goal[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.toggleBtn, goal === g && styles.toggleBtnActive]}
                onPress={() => setGoal(g)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, goal === g && styles.toggleBtnTextActive]}>
                  {GOAL_LABELS[g]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Body Fat (optional) */}
          <Text variant="label" style={styles.fieldLabel}>Body Fat % (optional)</Text>
          <TextInput
            style={styles.inputSingle}
            placeholder="e.g. 20"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={bodyFat}
            onChangeText={setBodyFat}
          />

          {/* Results Card */}
          {calculated && (
            <Card style={styles.resultsCard}>
              <View style={styles.resultsRow}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>BMI</Text>
                  <Text style={styles.resultValue}>{calculated.bmi}</Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>BMR</Text>
                  <Text style={styles.resultValue}>{calculated.bmr} kcal</Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>TDEE</Text>
                  <Text style={styles.resultValue}>{calculated.tdee} kcal</Text>
                </View>
              </View>
              <View style={styles.resultsSeparator} />
              <View style={styles.resultsRow}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Target</Text>
                  <Text style={[styles.resultValue, styles.resultHighlight]}>{calculated.calories} kcal</Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Protein</Text>
                  <Text style={styles.resultValue}>{calculated.proteinG}g</Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Carbs</Text>
                  <Text style={styles.resultValue}>{calculated.carbsG}g</Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Fat</Text>
                  <Text style={styles.resultValue}>{calculated.fatG}g</Text>
                </View>
              </View>
            </Card>
          )}

          <Button
            label="APPLY GOALS"
            onPress={handleApply}
            disabled={!calculated}
            style={styles.applyBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, paddingBottom: Spacing.md,
  },
  closeBtn: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
  form: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  fieldLabel: { marginBottom: Spacing.xs },
  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  activityScroll: { marginBottom: Spacing.xs },
  activityScrollContent: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: Spacing.xs },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.bgHighlight,
    borderColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
  },
  toggleBtnTextActive: {
    color: Colors.primary,
  },
  row3: { flexDirection: 'row', gap: Spacing.sm },
  thirdField: { flex: 1 },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    textAlign: 'center',
  },
  inputSingle: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  resultsCard: { gap: Spacing.sm },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  resultItem: { flex: 1, alignItems: 'center', gap: 2 },
  resultLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  resultHighlight: {
    color: Colors.primary,
    fontSize: FontSize.base,
  },
  resultDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.bgCardBorder,
  },
  resultsSeparator: {
    height: 1,
    backgroundColor: Colors.bgCardBorder,
    marginVertical: Spacing.xs,
  },
  applyBtn: { marginTop: Spacing.sm },
});
