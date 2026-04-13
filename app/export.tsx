import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { exportWorkoutsCSV, exportNutritionCSV } from '@/lib/export';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

type DateRange = { label: string; days: number | undefined };

const DATE_RANGES: DateRange[] = [
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'All Time', days: undefined },
];

export default function ExportScreen() {
  const { user } = useAuthStore();
  const [selectedRange, setSelectedRange] = useState<DateRange>(DATE_RANGES[0]);
  const [exportingWorkouts, setExportingWorkouts] = useState(false);
  const [exportingNutrition, setExportingNutrition] = useState(false);

  async function handleExportWorkouts() {
    if (!user) return;
    setExportingWorkouts(true);
    try {
      await exportWorkoutsCSV(user.id, selectedRange.days);
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message ?? 'Could not export workouts. Please try again.');
    } finally {
      setExportingWorkouts(false);
    }
  }

  async function handleExportNutrition() {
    if (!user) return;
    setExportingNutrition(true);
    try {
      await exportNutritionCSV(user.id, selectedRange.days);
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message ?? 'Could not export nutrition logs. Please try again.');
    } finally {
      setExportingNutrition(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text variant="heading">Export My Data 📤</Text>
        </View>

        <Text variant="body" style={styles.description}>
          Download your data as CSV to view in any spreadsheet app
        </Text>

        {/* Date range selector */}
        <Card style={styles.rangeCard}>
          <Text variant="label" style={styles.rangeLabel}>Date Range</Text>
          <View style={styles.pills}>
            {DATE_RANGES.map((range) => {
              const isActive = selectedRange.label === range.label;
              return (
                <TouchableOpacity
                  key={range.label}
                  onPress={() => setSelectedRange(range)}
                  style={[styles.pill, isActive && styles.pillActive]}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Export buttons */}
        <Card style={styles.exportCard}>
          <Text variant="title" style={styles.exportSectionTitle}>Export Data</Text>

          <TouchableOpacity
            style={[styles.exportBtn, exportingWorkouts && styles.exportBtnDisabled]}
            onPress={handleExportWorkouts}
            disabled={exportingWorkouts || exportingNutrition}
          >
            {exportingWorkouts ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.exportBtnText}>📊 Export Workouts</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportBtn, exportingNutrition && styles.exportBtnDisabled]}
            onPress={handleExportNutrition}
            disabled={exportingWorkouts || exportingNutrition}
          >
            {exportingNutrition ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.exportBtnText}>🥗 Export Nutrition</Text>
            )}
          </TouchableOpacity>
        </Card>

        <Text variant="caption" style={styles.hint}>
          CSV files can be opened in Excel, Google Sheets, or Numbers.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  header: { gap: Spacing.sm },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: FontSize.base, color: Colors.primary },
  description: { color: Colors.textSecondary },
  rangeCard: { gap: Spacing.md },
  rangeLabel: { marginBottom: Spacing.xs },
  pills: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.bgCard,
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.bgHighlight,
  },
  pillText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  pillTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  exportCard: { gap: Spacing.md },
  exportSectionTitle: { marginBottom: Spacing.xs },
  exportBtn: {
    backgroundColor: Colors.bgHighlight,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  exportBtnDisabled: { opacity: 0.5 },
  exportBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  hint: { textAlign: 'center', color: Colors.textMuted },
});
