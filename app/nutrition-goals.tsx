import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useNutritionStore } from '@/stores/nutrition';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize } from '@/lib/constants';

export default function NutritionGoalsScreen() {
  const { user } = useAuthStore();
  const { goals, saveGoals } = useNutritionStore();
  const [calories, setCalories] = useState(String(goals.calories));
  const [protein, setProtein] = useState(String(goals.proteinG));
  const [carbs, setCarbs] = useState(String(goals.carbsG));
  const [fat, setFat] = useState(String(goals.fatG));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const c = parseInt(calories);
    const p = parseInt(protein);
    const ch = parseInt(carbs);
    const f = parseInt(fat);
    if (!c || !p || !ch || !f) {
      Alert.alert('Invalid', 'All fields must be positive numbers.');
      return;
    }
    setSaving(true);
    await saveGoals(user!.id, { calories: c, proteinG: p, carbsG: ch, fatG: f });
    setSaving(false);
    router.back();
  }

  const FIELDS = [
    { label: 'Daily Calories', value: calories, set: setCalories, unit: 'kcal', color: Colors.primary },
    { label: 'Protein', value: protein, set: setProtein, unit: 'g', color: Colors.primary },
    { label: 'Carbohydrates', value: carbs, set: setCarbs, unit: 'g', color: Colors.info },
    { label: 'Fat', value: fat, set: setFat, unit: 'g', color: Colors.purple },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="heading" style={styles.title}>Nutrition Goals</Text>
        <Text variant="caption" style={styles.subtitle}>Set your daily macro targets</Text>

        {FIELDS.map((f) => (
          <Card key={f.label} style={styles.fieldCard}>
            <Text variant="label" style={{ color: f.color }}>{f.label}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.set}
                keyboardType="number-pad"
                placeholderTextColor={Colors.textMuted}
              />
              <Text variant="caption" style={styles.unit}>{f.unit}</Text>
            </View>
          </Card>
        ))}

        <Button label="SAVE GOALS" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.md },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: Spacing.md },
  fieldCard: { gap: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    textAlign: 'center',
  },
  unit: { width: 36 },
  saveBtn: { marginTop: Spacing.md },
});
