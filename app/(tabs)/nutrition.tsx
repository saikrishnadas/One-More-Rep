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
import { AutoGoalsModal } from '@/components/nutrition/AutoGoalsModal';
import { Colors, Spacing, FontSize, FontWeight } from '@/lib/constants';
import { Settings, Zap, Dumbbell, BarChart2, Sunrise, Sun, Moon, Cookie } from 'lucide-react-native';
import { formatDate } from '@/lib/utils';
import type { NutritionEntry } from '@/stores/nutrition';

type MealType = NutritionEntry['mealType'];

const MEALS: { type: MealType; title: string; icon: React.ReactNode }[] = [
  { type: 'breakfast', title: 'Breakfast', icon: <Sunrise size={18} color={Colors.textSecondary} /> },
  { type: 'lunch',     title: 'Lunch',     icon: <Sun size={18} color={Colors.textSecondary} /> },
  { type: 'dinner',    title: 'Dinner',    icon: <Moon size={18} color={Colors.textSecondary} /> },
  { type: 'snack',     title: 'Snacks',    icon: <Cookie size={18} color={Colors.textSecondary} /> },
];

export default function NutritionScreen() {
  const { user } = useAuthStore();
  const { entries, goals, selectedDate, loadDay, loadGoals, saveGoals, addEntry, removeEntry, setSelectedDate, workoutCaloriesBurned } = useNutritionStore();
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null);
  const [showAutoGoals, setShowAutoGoals] = useState(false);

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

        {/* Workout burn deduction */}
        {workoutCaloriesBurned > 0 && (
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Dumbbell size={14} color={Colors.warning} />
                <Text variant="label">Workout Burn</Text>
              </View>
              <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.warning }}>
                -{workoutCaloriesBurned} kcal
              </Text>
            </View>
            <Text variant="caption">
              Net: {Math.max(0, totalCalories - workoutCaloriesBurned)} kcal consumed
            </Text>
          </Card>
        )}

        {/* Goals link */}
        <View style={styles.goalsRow}>
          <TouchableOpacity onPress={() => router.push('/nutrition-goals')} style={styles.goalsLink}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Settings size={14} color={Colors.textMuted} />
              <Text style={styles.goalsLinkText}>Edit Goals · {goals.calories} kcal target</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAutoGoals(true)} style={styles.autoBtn}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Zap size={14} color={Colors.primary} />
              <Text style={styles.autoBtnText}>Auto</Text>
            </View>
          </TouchableOpacity>
        </View>

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={14} color={Colors.primary} />
            <Text style={styles.reportLinkText}>View Weekly Report →</Text>
          </View>
        </TouchableOpacity>

        {/* Cheat day log link */}
        <TouchableOpacity onPress={() => router.push('/cheat-day')} style={{ marginTop: Spacing.sm }}>
          <Text style={{ textAlign: 'center', color: Colors.warning, fontSize: FontSize.sm }}>
            🍕 Cheat Day Log →
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AutoGoalsModal
        visible={showAutoGoals}
        onClose={() => setShowAutoGoals(false)}
        onApply={(g) => { if (user) saveGoals(user.id, g); setShowAutoGoals(false); }}
      />

      {/* Add food modal */}
      {activeMeal && (
        <AddFoodModal
          visible={!!activeMeal}
          mealType={activeMeal}
          onClose={() => setActiveMeal(null)}
          onAdd={(entry) => { if (user) addEntry(user.id, entry); }}
          userId={user?.id}
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
  goalsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
  goalsLink: { flex: 1, alignItems: 'center' },
  goalsLinkText: { fontSize: 13, color: Colors.textSecondary },
  autoBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  autoBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  reportLink: { alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  reportLinkText: { fontSize: 13, color: Colors.primary },
});
