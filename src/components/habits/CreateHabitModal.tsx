import React, { useState } from 'react';
import {
  Modal, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { HabitIcon } from '@/components/ui/HabitIcon';
import { Check, Hash } from 'lucide-react-native';

const ICONS = ['target', 'dumbbell', 'run', 'book', 'water', 'salad', 'sleep', 'mindfulness', 'bike', 'swim', 'write', 'music', 'clean', 'medicine', 'sunrise'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; icon: string; habitType: 'boolean' | 'count'; targetCount: number; reminderTime: string | null }) => void;
}

export function CreateHabitModal({ visible, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('target');
  const [type, setType] = useState<'boolean' | 'count'>('boolean');
  const [targetCount, setTargetCount] = useState('1');
  const [reminder, setReminder] = useState('');

  function handleCreate() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    onCreate({
      name: name.trim(),
      icon,
      habitType: type,
      targetCount: parseInt(targetCount) || 1,
      reminderTime: reminder || null,
    });
    setName('');
    setIcon('target');
    setType('boolean');
    setTargetCount('1');
    setReminder('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text variant="title">New Habit</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text variant="label" style={styles.label}>Habit Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning Run"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text variant="label" style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconBtn, ic === icon && styles.iconBtnActive]}
                onPress={() => setIcon(ic)}
              >
                <HabitIcon name={ic} size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          <Text variant="label" style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {(['boolean', 'count'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                onPress={() => setType(t)}
              >
                {t === 'boolean' ? (
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Check size={14} color={type === 'boolean' ? Colors.primary : Colors.textSecondary} />
                    <Text style={[styles.typeBtnText, type === 'boolean' && { color: Colors.primary }]}>Check-off</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Hash size={14} color={type === 'count' ? Colors.primary : Colors.textSecondary} />
                    <Text style={[styles.typeBtnText, type === 'count' && { color: Colors.primary }]}>Count</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {type === 'count' && (
            <>
              <Text variant="label" style={styles.label}>Daily Target</Text>
              <TextInput
                style={[styles.input, styles.smallInput]}
                keyboardType="number-pad"
                value={targetCount}
                onChangeText={setTargetCount}
                placeholder="1"
                placeholderTextColor={Colors.textMuted}
              />
            </>
          )}

          <Text variant="label" style={styles.label}>Daily Reminder (optional)</Text>
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="e.g. 07:30"
            placeholderTextColor={Colors.textMuted}
            value={reminder}
            onChangeText={setReminder}
            keyboardType="numbers-and-punctuation"
          />

          <Button label="CREATE HABIT" onPress={handleCreate} style={styles.createBtn} />
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
  closeBtn: { fontSize: FontSize.base, color: Colors.textSecondary },
  form: { padding: Spacing.xl, gap: Spacing.md },
  label: { marginBottom: 2 },
  input: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base,
  },
  smallInput: { width: 100 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconBtn: {
    width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
  },
  iconBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
  },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  typeBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  createBtn: { marginTop: Spacing.lg },
});
