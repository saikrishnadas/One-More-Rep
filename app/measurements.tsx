import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useMeasurementsStore } from '@/stores/measurements';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WeightChart } from '@/components/stats/WeightChart';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

type Range = 30 | 90 | 365;

export default function MeasurementsScreen() {
  const { user, profile } = useAuthStore();
  const { history, loadHistory, addEntry } = useMeasurementsStore();
  const [range, setRange] = useState<Range>(90);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    weightKg: '', chestCm: '', waistCm: '', hipsCm: '',
    armsCm: '', thighsCm: '', neckCm: '', heightCm: '',
  });

  useEffect(() => {
    if (user) loadHistory(user.id);
  }, [user]);

  // Body fat estimation (US Navy method, simplified - male/female generic)
  function estimateBodyFat(): string | null {
    const waist = parseFloat(form.waistCm);
    const neck = parseFloat(form.neckCm);
    const height = parseFloat(form.heightCm) || (profile as any)?.heightCm;
    if (!waist || !neck || !height || waist <= neck) return null;
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    return bf > 0 && bf < 60 ? bf.toFixed(1) : null;
  }

  async function handleSave() {
    if (!user) return;
    if (!form.weightKg && !form.waistCm && !form.chestCm) {
      Alert.alert('Enter at least one measurement');
      return;
    }
    setSaving(true);
    try {
      const bf = estimateBodyFat();
      await addEntry(user.id, {
        weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
        chestCm: form.chestCm ? parseFloat(form.chestCm) : null,
        waistCm: form.waistCm ? parseFloat(form.waistCm) : null,
        hipsCm: form.hipsCm ? parseFloat(form.hipsCm) : null,
        armsCm: form.armsCm ? parseFloat(form.armsCm) : null,
        thighsCm: form.thighsCm ? parseFloat(form.thighsCm) : null,
        neckCm: form.neckCm ? parseFloat(form.neckCm) : null,
        heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
        bodyFatPct: bf ? parseFloat(bf) : null,
        notes: null,
      });
      setForm({ weightKg: '', chestCm: '', waistCm: '', hipsCm: '', armsCm: '', thighsCm: '', neckCm: '', heightCm: '' });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  const weightData = history
    .filter(h => h.weightKg != null)
    .map(h => ({ date: h.date, weightKg: h.weightKg! }));

  const latest = history[0];
  const prev = history[1];

  function delta(field: keyof typeof latest, unit: string): string {
    if (!latest || !prev) return '';
    const a = latest[field] as number | null;
    const b = prev[field] as number | null;
    if (a == null || b == null) return '';
    const d = a - b;
    const arrow = d < 0 ? '↓' : d > 0 ? '↑' : '→';
    return `${arrow} ${Math.abs(d).toFixed(1)}${unit}`;
  }

  const MEASUREMENTS = [
    { key: 'weightKg', label: 'Weight (kg)', unit: 'kg' },
    { key: 'chestCm', label: 'Chest (cm)', unit: 'cm' },
    { key: 'waistCm', label: 'Waist (cm)', unit: 'cm' },
    { key: 'hipsCm', label: 'Hips (cm)', unit: 'cm' },
    { key: 'armsCm', label: 'Arms (cm)', unit: 'cm' },
    { key: 'thighsCm', label: 'Thighs (cm)', unit: 'cm' },
    { key: 'neckCm', label: 'Neck (cm)', unit: 'cm' },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text variant="heading">Body & Measurements</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtn}>{showForm ? 'Cancel' : '+ Log'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Log form */}
        {showForm && (
          <Card style={styles.formCard}>
            <Text variant="label" style={{ marginBottom: Spacing.md }}>Today's Measurements</Text>
            <View style={styles.formGrid}>
              {MEASUREMENTS.map(({ key, label }) => (
                <View key={key} style={styles.formField}>
                  <Text variant="caption" style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="—"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    value={form[key as keyof typeof form]}
                    onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  />
                </View>
              ))}
            </View>
            {form.waistCm && form.neckCm && (
              <Text variant="caption" style={styles.bfEstimate}>
                Est. Body Fat: {estimateBodyFat() ?? '—'}% (US Navy method, estimate only)
              </Text>
            )}
            <Button label="SAVE MEASUREMENTS" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
          </Card>
        )}

        {/* Weight chart */}
        {weightData.length > 0 && (
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text variant="label">Weight Trend</Text>
              <View style={styles.rangeRow}>
                {([30, 90, 365] as Range[]).map(r => (
                  <TouchableOpacity key={r} onPress={() => setRange(r)}
                    style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}>
                    <Text style={[styles.rangeBtnText, range === r && { color: Colors.primary }]}>
                      {r === 365 ? '1Y' : `${r}D`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <WeightChart data={weightData} days={range} />
          </Card>
        )}

        {/* Latest measurements summary */}
        {latest && (
          <Card style={styles.summaryCard}>
            <Text variant="label" style={{ marginBottom: Spacing.md }}>Latest ({latest.date})</Text>
            <View style={styles.measureGrid}>
              {MEASUREMENTS.map(({ key, label, unit }) => {
                const val = latest[key as keyof typeof latest] as number | null;
                if (val == null) return null;
                const d = delta(key as any, unit);
                return (
                  <View key={key} style={styles.measureItem}>
                    <Text variant="caption" style={styles.measureLabel}>{label}</Text>
                    <Text style={styles.measureValue}>{val}{unit}</Text>
                    {d ? <Text style={styles.measureDelta}>{d}</Text> : null}
                  </View>
                );
              })}
              {latest.bodyFatPct && (
                <View style={styles.measureItem}>
                  <Text variant="caption" style={styles.measureLabel}>Body Fat (est.)</Text>
                  <Text style={styles.measureValue}>{latest.bodyFatPct.toFixed(1)}%</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Empty state */}
        {history.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📏</Text>
            <Text variant="title" style={{ marginTop: Spacing.md }}>No measurements yet</Text>
            <Text variant="caption">Tap "+ Log" to record today's measurements</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, paddingBottom: Spacing.md },
  backBtn: { fontSize: 28, color: Colors.primary, fontWeight: '300' },
  addBtn: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
  content: { padding: Spacing.xl, gap: Spacing.md, paddingTop: 0 },
  formCard: { gap: Spacing.sm },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  formField: { width: '47%' },
  fieldLabel: { marginBottom: 4 },
  input: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base,
  },
  bfEstimate: { color: Colors.primary, marginTop: Spacing.sm },
  chartCard: { gap: Spacing.sm },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rangeRow: { flexDirection: 'row', gap: Spacing.sm },
  rangeBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  rangeBtnActive: { backgroundColor: Colors.bgHighlight },
  rangeBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold },
  summaryCard: {},
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  measureItem: { width: '30%' },
  measureLabel: { marginBottom: 2 },
  measureValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  measureDelta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
});
