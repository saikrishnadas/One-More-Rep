import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { nutritionLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useAuthStore } from '@/stores/auth';
import { useNutritionStore } from '@/stores/nutrition';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MacroBar } from '@/components/nutrition/MacroBar';
import { Colors, Spacing, FontSize, FontWeight } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface DayStats {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export default function NutritionReportScreen() {
  const { user } = useAuthStore();
  const { goals } = useNutritionStore();
  const [weekStats, setWeekStats] = useState<DayStats[]>([]);

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoStr = formatDate(weekAgo);

    db.select().from(nutritionLogs)
      .where(eq(nutritionLogs.userId, user.id))
      .then((rows) => {
        const filtered = rows.filter((r) => r.date >= weekAgoStr);
        // Group by date
        const byDate: Record<string, DayStats> = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = formatDate(d);
          byDate[ds] = { date: ds, calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
        }
        for (const r of filtered) {
          if (byDate[r.date]) {
            byDate[r.date].calories += r.calories ?? 0;
            byDate[r.date].proteinG += r.proteinG ?? 0;
            byDate[r.date].carbsG += r.carbsG ?? 0;
            byDate[r.date].fatG += r.fatG ?? 0;
          }
        }
        setWeekStats(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
      });
  }, [user]);

  const loggedDays = weekStats.filter((d) => d.calories > 0);
  const avgCalories = loggedDays.length > 0
    ? loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length
    : 0;
  const avgProtein = loggedDays.length > 0
    ? loggedDays.reduce((s, d) => s + d.proteinG, 0) / loggedDays.length
    : 0;
  const proteinGoalDays = weekStats.filter((d) => d.proteinG >= goals.proteinG).length;

  const maxCalories = Math.max(...weekStats.map((d) => d.calories), goals.calories);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="heading">Weekly Report</Text>
          <Text variant="caption">Last 7 days</Text>
        </View>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Days Logged', value: String(loggedDays.length) },
            { label: 'Avg Calories', value: Math.round(avgCalories).toString() },
            { label: 'Protein Goal', value: `${proteinGoalDays}/7` },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text variant="heading" color={Colors.primary}>{s.value}</Text>
              <Text variant="label">{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Calorie chart (bar chart) */}
        <Card style={styles.chartCard}>
          <Text variant="label" style={{ marginBottom: Spacing.md }}>Daily Calories</Text>
          <View style={styles.barChart}>
            {weekStats.map((day) => {
              const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
              const isToday = day.date === formatDate(new Date());
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <View key={day.date} style={styles.barCol}>
                  <View style={styles.barWrapper}>
                    <View style={[
                      styles.bar,
                      { height: `${barHeight}%` || '2%', backgroundColor: isToday ? Colors.primary : Colors.bgCardBorder },
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && { color: Colors.primary }]}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
          {/* Goal line indicator */}
          <Text variant="caption" style={{ marginTop: Spacing.sm }}>Goal: {goals.calories} kcal/day</Text>
        </Card>

        {/* Avg macros */}
        <Card style={styles.macrosCard}>
          <Text variant="label" style={{ marginBottom: Spacing.md }}>Average Daily Macros</Text>
          <View style={{ gap: Spacing.md }}>
            <MacroBar label="Protein" consumed={avgProtein} goal={goals.proteinG} color={Colors.primary} />
            <MacroBar label="Carbs"   consumed={loggedDays.reduce((s,d) => s + d.carbsG, 0) / (loggedDays.length || 1)} goal={goals.carbsG} color={Colors.info} />
            <MacroBar label="Fat"     consumed={loggedDays.reduce((s,d) => s + d.fatG, 0) / (loggedDays.length || 1)} goal={goals.fatG} color={Colors.purple} />
          </View>
        </Card>

        <Button label="← Back" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  header: { alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  chartCard: {},
  barChart: { flexDirection: 'row', height: 100, alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3, minHeight: 2 },
  barLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold },
  macrosCard: {},
});
