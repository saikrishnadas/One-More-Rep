import React, { useEffect, useState } from 'react';
import {
  Modal, View, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { useTemplatesStore, WorkoutTemplate, TemplateExercise } from '@/stores/templates';
import { useAuthStore } from '@/stores/auth';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: WorkoutTemplate, exercises: TemplateExercise[]) => void;
}

export function TemplatesModal({ visible, onClose, onSelect }: Props) {
  const { user } = useAuthStore();
  const { templates, loading, loadTemplates, loadTemplateExercises, deleteTemplate } = useTemplatesStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exerciseCache, setExerciseCache] = useState<Record<string, TemplateExercise[]>>({});

  useEffect(() => {
    if (visible && user) loadTemplates(user.id);
  }, [visible, user]);

  async function handleExpand(templateId: string) {
    if (expandedId === templateId) { setExpandedId(null); return; }
    setExpandedId(templateId);
    if (!exerciseCache[templateId]) {
      const exs = await loadTemplateExercises(templateId);
      setExerciseCache(c => ({ ...c, [templateId]: exs }));
    }
  }

  async function handleSelect(template: WorkoutTemplate) {
    const exs = exerciseCache[template.id] ?? await loadTemplateExercises(template.id);
    setExerciseCache(c => ({ ...c, [template.id]: exs }));
    onSelect(template, exs);
    onClose();
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Delete Template', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(id) },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text variant="title">Workout Templates</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
        ) : templates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text variant="title" style={{ marginTop: Spacing.md }}>No templates yet</Text>
            <Text variant="caption" style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
              After a workout, tap "Save as Template" to reuse it.
            </Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={t => t.id}
            contentContainerStyle={styles.list}
            renderItem={({ item: t }) => (
              <Card style={styles.templateCard}>
                <TouchableOpacity onPress={() => handleExpand(t.id)} style={styles.templateHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templateName}>{t.name}</Text>
                    <Text variant="caption">{t.exerciseCount} exercises</Text>
                  </View>
                  <Text style={styles.chevron}>{expandedId === t.id ? '▾' : '▸'}</Text>
                </TouchableOpacity>

                {expandedId === t.id && (
                  <View style={styles.exerciseList}>
                    {(exerciseCache[t.id] ?? []).map((ex, i) => (
                      <Text key={i} variant="caption" style={styles.exerciseRow}>
                        {i + 1}. {ex.exerciseName} — {ex.sets}×{ex.targetReps}
                        {ex.targetWeightKg > 0 ? ` @ ${ex.targetWeightKg}kg` : ''}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={styles.templateActions}>
                  <TouchableOpacity style={styles.startBtn} onPress={() => handleSelect(t)}>
                    <Text style={styles.startBtnText}>▶ Start Workout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(t.id, t.name)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgCardBorder,
  },
  closeBtn: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  list: { padding: Spacing.xl },
  templateCard: { gap: Spacing.md },
  templateHeader: { flexDirection: 'row', alignItems: 'center' },
  templateName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  chevron: { fontSize: FontSize.lg, color: Colors.textMuted },
  exerciseList: { gap: Spacing.xs, paddingLeft: Spacing.sm, borderLeftWidth: 2, borderLeftColor: Colors.bgCardBorder },
  exerciseRow: { lineHeight: 20 },
  templateActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  startBtn: {
    flex: 1, backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: Spacing.sm, alignItems: 'center',
  },
  startBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.heavy, color: Colors.primary },
  deleteBtn: { padding: Spacing.sm },
  deleteBtnText: { fontSize: FontSize.lg },
});
