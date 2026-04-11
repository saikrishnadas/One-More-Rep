import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useNutritionStore } from '@/stores/nutrition';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CalorieRing } from '@/components/nutrition/CalorieRing';
import { MacroBar } from '@/components/nutrition/MacroBar';
import { MealSection } from '@/components/nutrition/MealSection';
import { AddFoodModal } from '@/components/nutrition/AddFoodModal';
import { Colors, Spacing } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { NutritionEntry } from '@/stores/nutrition';

type MealType = NutritionEntry['mealType'];

const MEALS: { type: MealType; title: string; icon: string }[] = [
  { type: 'breakfast', title: 'Breakfast', icon: '🌅' },
  { type: 'lunch',     title: 'Lunch',     icon: '☀️' },
  { type: 'dinner',    title: 'Dinner',    icon: '🌙' },
  { type: 'snack',     title: 'Snacks',    icon: '🍎' },
];

export default function NutritionScreen() {
  const { user } = useAuthStore();
  const { entries, goals, selectedDate, loadDay, loadGoals, addEntry, removeEntry, setSelectedDate } = useNutritionStore();
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null);

  useEffect(() => {
    if (!user) return;
    loadGoals(user.id);
    loadDay(user.id);
  }, [user]);

  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = entries.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = entries.reduce((s, e) => s + e.carbsG, 0);
  const totalFat = entries.reduce((s, e) => s + e.fatG, 0);

  function navigateDay(offset: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    const newDate = formatDate(d);
    setSelectedDate(newDate);
    if (user) loadDay(user.id, newDate);
  }

  const isToday = selectedDate === formatDate(new Date());

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with date navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateDay(-1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.dateBlock}>
          <Text variant="heading">Nutrition</Text>
          <Text variant="caption">{isToday ? 'Today' : selectedDate}</Text>
        </View>
        <TouchableOpacity onPress={() => navigateDay(1)} style={styles.navBtn} disabled={isToday}>
          <Text style={[styles.navArrow, isToday && { opacity: 0.3 }]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Calorie ring + macros */}
        <Card style={styles.summaryCard}>
          <View style={styles.ringRow}>
            <CalorieRing consumed={totalCalories} goal={goals.calories} />
            <View style={styles.macros}>
              <MacroBar label="Protein" consumed={totalProtein} goal={goals.proteinG} color={Colors.primary} />
              <MacroBar label="Carbs"   consumed={totalCarbs}   goal={goals.carbsG}   color={Colors.info} />
              <MacroBar label="Fat"     consumed={totalFat}     goal={goals.fatG}     color={Colors.purple} />
            </View>
          </View>
        </Card>

        {/* Goals link */}
        <TouchableOpacity onPress={() => router.push('/nutrition-goals')} style={styles.goalsLink}>
          <Text style={styles.goalsLinkText}>⚙️ Edit Goals · {goals.calories} kcal target</Text>
        </TouchableOpacity>

        {/* Meal sections */}
        {MEALS.map((meal) => (
          <MealSection
            key={meal.type}
            title={meal.title}
            icon={meal.icon}
            entries={entries.filter((e) => e.mealType === meal.type)}
            onAdd={() => setActiveMeal(meal.type)}
            onRemove={(id) => removeEntry(id)}
          />
        ))}

        {/* Weekly report link */}
        <TouchableOpacity onPress={() => router.push('/nutrition-report')} style={styles.reportLink}>
          <Text style={styles.reportLinkText}>📊 View Weekly Report →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add food modal */}
      {activeMeal && (
        <AddFoodModal
          visible={!!activeMeal}
          mealType={activeMeal}
          onClose={() => setActiveMeal(null)}
          onAdd={(entry) => { if (user) addEntry(user.id, entry); }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  navBtn: { padding: Spacing.sm },
  navArrow: { fontSize: 28, color: Colors.primary, fontWeight: '300' },
  dateBlock: { alignItems: 'center' },
  content: { padding: Spacing.xl, paddingTop: Spacing.sm },
  summaryCard: { marginBottom: Spacing.md },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  macros: { flex: 1, gap: Spacing.md },
  goalsLink: { alignItems: 'center', marginBottom: Spacing.lg },
  goalsLinkText: { fontSize: 13, color: Colors.textSecondary },
  reportLink: { alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  reportLinkText: { fontSize: 13, color: Colors.primary },
});
