import React, { useState } from 'react';
import {
  Modal, View, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/lib/constants';
import { calculatePlates } from '@/lib/plate-calculator';

interface Props {
  visible: boolean;
  initialWeightKg: number;
  onClose: () => void;
}

const PLATE_COLORS: Record<number, string> = {
  25: '#ef4444',
  20: '#3b82f6',
  15: '#f59e0b',
  10: '#22c55e',
  5: '#ffffff',
  2.5: '#9ca3af',
  1.25: '#9ca3af',
};

const BARBELL_OPTIONS = [15, 20];

export function PlateCalculatorModal({ visible, initialWeightKg, onClose }: Props) {
  const [barbellKg, setBarbellKg] = useState(20);
  const [targetKg, setTargetKg] = useState(initialWeightKg > 0 ? initialWeightKg : 60);

  const result = calculatePlates(targetKg, barbellKg);

  function increment() {
    setTargetKg((prev) => Math.round((prev + 2.5) * 10) / 10);
  }

  function decrement() {
    setTargetKg((prev) => Math.max(0, Math.round((prev - 2.5) * 10) / 10));
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Plate Calculator 🏋️</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Barbell selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Barbell</Text>
            <View style={styles.row}>
              {BARBELL_OPTIONS.map((kg) => (
                <TouchableOpacity
                  key={kg}
                  style={[styles.barbellBtn, barbellKg === kg && styles.barbellBtnActive]}
                  onPress={() => setBarbellKg(kg)}
                >
                  <Text style={[styles.barbellBtnText, barbellKg === kg && styles.barbellBtnTextActive]}>
                    {kg} kg
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target weight */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Target Weight</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.adjustBtn} onPress={decrement}>
                <Text style={styles.adjustBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.weightDisplay}>
                <Text style={styles.weightValue}>{targetKg}</Text>
                <Text style={styles.weightUnit}>kg</Text>
              </View>
              <TouchableOpacity style={styles.adjustBtn} onPress={increment}>
                <Text style={styles.adjustBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Plate visualization */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Each Side</Text>
            {result.perSide.length === 0 ? (
              <View style={styles.emptyPlates}>
                <Text style={styles.emptyPlatesText}>No plates needed — just the bar</Text>
              </View>
            ) : (
              <View style={styles.platesRow}>
                {result.perSide.map((plate, index) => (
                  <View
                    key={index}
                    style={[
                      styles.plateChip,
                      { backgroundColor: PLATE_COLORS[plate] ?? '#9ca3af' },
                      plate === 5 && styles.plateChipBorder,
                    ]}
                  >
                    <Text style={[styles.plateChipText, plate === 5 && styles.plateChipTextDark]}>
                      {plate}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {result.perSide.length > 0 && (
              <Text style={styles.plateSummary}>
                {result.perSide.join(' + ')} kg
              </Text>
            )}
          </View>

          {/* Total */}
          <View style={styles.totalBlock}>
            <Text style={styles.totalText}>
              Total: {result.totalWithBar} kg on {barbellKg} kg bar
            </Text>
            {!result.isExact && (
              <View style={styles.warningRow}>
                <Text style={styles.warningText}>
                  ⚠️ Closest: {result.totalWithBar} kg (off by {result.remainder} kg)
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCardBorder,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: Spacing.sm,
  },
  closeBtnText: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  barbellBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.bgCard,
  },
  barbellBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  barbellBtnText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  barbellBtnTextActive: {
    color: Colors.primary,
  },
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: {
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  weightDisplay: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  weightValue: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
  },
  weightUnit: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  platesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  plateChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    minWidth: 44,
    alignItems: 'center',
  },
  plateChipBorder: {
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  plateChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
  },
  plateChipTextDark: {
    color: '#111111',
  },
  plateSummary: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  emptyPlates: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  emptyPlatesText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  totalBlock: {
    padding: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    gap: Spacing.sm,
  },
  totalText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  warningRow: {
    alignItems: 'center',
  },
  warningText: {
    fontSize: FontSize.base,
    color: Colors.warning,
    textAlign: 'center',
  },
});
