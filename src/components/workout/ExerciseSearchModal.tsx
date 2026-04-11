import React, { useState, useEffect } from 'react';
import {
  View, Modal, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { db } from '@/db/client';
import { exercises as exercisesTable } from '@/db/schema';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/data/exercises';

interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: { id: string; name: string; primaryMuscle: string }) => void;
}

export function ExerciseSearchModal({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);
  const [all, setAll] = useState<Exercise[]>([]);

  useEffect(() => {
    if (visible) {
      db.select().from(exercisesTable).then(setAll);
    }
  }, [visible]);

  const filtered = all.filter((e) => {
    const matchesQuery = query.length === 0 || e.name.toLowerCase().includes(query.toLowerCase());
    const matchesMuscle = !muscleFilter || e.primaryMuscle === muscleFilter;
    const matchesEquip = !equipmentFilter || e.equipment === equipmentFilter;
    return matchesQuery && matchesMuscle && matchesEquip;
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="title">Add Exercise</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          clearButtonMode="while-editing"
        />

        {/* Muscle filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
          {MUSCLE_GROUPS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, muscleFilter === m && styles.chipActive]}
              onPress={() => setMuscleFilter(muscleFilter === m ? null : m)}
            >
              <Text style={[styles.chipText, muscleFilter === m && styles.chipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Equipment filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
          {EQUIPMENT_TYPES.map((eq) => (
            <TouchableOpacity
              key={eq}
              style={[styles.chip, equipmentFilter === eq && styles.chipActive]}
              onPress={() => setEquipmentFilter(equipmentFilter === eq ? null : eq)}
            >
              <Text style={[styles.chipText, equipmentFilter === eq && styles.chipTextActive]}>{eq}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultRow}
              onPress={() => { onSelect(item); onClose(); }}
              activeOpacity={0.7}
            >
              <View style={styles.resultText}>
                <Text variant="body">{item.name}</Text>
                <Text variant="caption">{item.primaryMuscle} · {item.equipment}</Text>
              </View>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text variant="caption" style={styles.empty}>No exercises found</Text>
          }
        />
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
  searchInput: {
    margin: Spacing.xl, marginTop: 0,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  chipsScroll: { maxHeight: 40, marginBottom: Spacing.sm },
  chips: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.bgCard,
  },
  chipActive: { backgroundColor: Colors.bgHighlight, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  chipTextActive: { color: Colors.primary },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  resultText: { flex: 1 },
  addIcon: { fontSize: 22, color: Colors.primary, fontWeight: FontWeight.heavy },
  separator: { height: 1, backgroundColor: Colors.bgCardBorder, marginLeft: Spacing.xl },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl },
});
