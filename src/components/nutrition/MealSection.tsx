import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import type { NutritionEntry } from '@/stores/nutrition';

interface MealSectionProps {
  title: string;
  icon: string;
  entries: NutritionEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function MealSection({ title, icon, entries, onAdd, onRemove }: MealSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const totalCals = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{icon}</Text>
          <Text variant="title">{title}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text variant="caption">{Math.round(totalCals)} kcal</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Food items */}
      {expanded && (
        <View style={styles.items}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryInfo}>
                <Text variant="body">{entry.foodName}</Text>
                <Text variant="caption">
                  {Math.round(entry.calories)} kcal · P:{Math.round(entry.proteinG)}g · C:{Math.round(entry.carbsG)}g · F:{Math.round(entry.fatG)}g
                </Text>
              </View>
              <TouchableOpacity onPress={() => onRemove(entry.id)} hitSlop={8} style={styles.removeBtn}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add food button */}
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addText}>+ Add Food</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icon: { fontSize: 18 },
  chevron: { fontSize: FontSize.xs, color: Colors.textMuted },
  items: { borderTopWidth: 1, borderTopColor: Colors.bgCardBorder },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCardBorder,
  },
  entryInfo: { flex: 1 },
  removeBtn: { padding: 4 },
  removeIcon: { fontSize: FontSize.sm, color: Colors.textMuted },
  addBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  addText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
});
