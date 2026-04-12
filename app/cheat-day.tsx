import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useCheatDayStore } from '@/stores/cheatDay';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { ChevronLeft, Cookie, Calendar, Flame } from 'lucide-react-native';
import { formatDate } from '@/lib/utils';

export default function CheatDayScreen() {
  const { user, profile } = useAuthStore();
  const { logs, load, logCheatDay, isCheatDay, suggestBestDay } = useCheatDayStore();
  const [notes, setNotes] = useState('');
  const [guilt, setGuilt] = useState(0);
  const [type, setType] = useState<'planned' | 'spontaneous'>('planned');
  const [saving, setSaving] = useState(false);

  const today = formatDate(new Date());
  const alreadyLoggedToday = isCheatDay(today);
  const suggestedDay = suggestBestDay(profile?.trainingDaysPerWeek ?? 4);
  const totalCheatDays = logs.length;
  const thisMonthCheatDays = logs.filter(l => l.date.startsWith(today.slice(0, 7))).length;

  useEffect(() => { if (user) load(user.id); }, [user]);

  async function handleLog() {
    if (!user) return;
    setSaving(true);
    try {
      await logCheatDay(user.id, { notes, plannedVsActual: type, guilt });
      Alert.alert('Logged!', "No guilt — one cheat day won't break your progress. Back on track tomorrow!", [{ text: "Let's go! 💪" }]);
      setNotes('');
      setGuilt(0);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text variant="heading" style={{ flex: 1, textAlign: 'center' }}>Cheat Day</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Cookie size={20} color={Colors.warning} />
            <Text style={styles.statValue}>{thisMonthCheatDays}</Text>
            <Text variant="caption">This month</Text>
          </Card>
          <Card style={styles.statCard}>
            <Calendar size={20} color={Colors.info} />
            <Text style={styles.statValue}>{totalCheatDays}</Text>
            <Text variant="caption">Total logged</Text>
          </Card>
        </View>

        <Card style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Flame size={16} color={Colors.primary} />
            <Text variant="label" color={Colors.primary}>Best Day for Cheat Day</Text>
          </View>
          <Text variant="title">{suggestedDay}</Text>
          <Text variant="caption">
            Based on your {profile?.trainingDaysPerWeek ?? 4}x/week schedule — train hard all week, enjoy {suggestedDay}, and your body will use those extra calories for recovery and muscle building.
          </Text>
        </Card>

        <Card style={{ gap: Spacing.sm }}>
          <Text variant="title">Coach Tips</Text>
          {[
            '✦ Cheat meals are most effective after a heavy training week',
            '✦ Stick to one cheat meal, not a full cheat day, for best results',
            '✦ Prioritise protein even on cheat day — it limits fat gain',
            "✦ Don't skip your workout the day after. Use the extra glycogen!",
            '✦ Keep cheat days to 1× per week max for fat loss goals',
          ].map((tip, i) => <Text key={i} variant="caption" style={{ lineHeight: 20 }}>{tip}</Text>)}
        </Card>

        {alreadyLoggedToday ? (
          <Card style={{ alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl }}>
            <Cookie size={32} color={Colors.warning} />
            <Text variant="title">Cheat day logged for today!</Text>
            <Text variant="caption" style={{ textAlign: 'center' }}>Back on track tomorrow. You've got this.</Text>
          </Card>
        ) : (
          <Card style={{ gap: Spacing.md }}>
            <Text variant="title">Log Today's Cheat Day</Text>

            <View>
              <Text variant="label" style={styles.fieldLabel}>Type</Text>
              <View style={styles.chipRow}>
                {(['planned', 'spontaneous'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, type === t && styles.chipActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.chipText, type === t && { color: Colors.primary }]}>
                      {t === 'planned' ? 'Planned' : 'Spontaneous'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text variant="label" style={styles.fieldLabel}>Guilt level (0 = no guilt, 10 = very guilty)</Text>
              <View style={styles.guiltRow}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.guiltBubble, guilt === n && styles.guiltBubbleActive]}
                    onPress={() => setGuilt(n)}
                  >
                    <Text style={[styles.guiltText, guilt === n && { color: Colors.primary }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {guilt >= 7 && (
                <Text variant="caption" color={Colors.warning} style={{ marginTop: 4 }}>
                  Don't stress! One meal won't undo weeks of work. The guilt itself is more harmful than the food.
                </Text>
              )}
            </View>

            <View>
              <Text variant="label" style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.textarea}
                value={notes}
                onChangeText={setNotes}
                placeholder="What did you eat? How do you feel?"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <Button label={saving ? 'Logging...' : 'Log Cheat Day'} onPress={handleLog} />
          </Card>
        )}

        {logs.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <Text variant="title">History</Text>
            {logs.slice().reverse().slice(0, 10).map(l => (
              <Card key={l.id} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <Cookie size={14} color={Colors.warning} />
                  <Text variant="body">{l.date}</Text>
                  <View style={[styles.badge, l.plannedVsActual === 'planned' ? styles.badgePlanned : styles.badgeSpontaneous]}>
                    <Text style={styles.badgeText}>{l.plannedVsActual}</Text>
                  </View>
                </View>
                {l.notes && <Text variant="caption">{l.notes}</Text>}
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40 },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: Spacing.lg },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  fieldLabel: { marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.bgCardBorder, backgroundColor: Colors.bgCard },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  guiltRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  guiltBubble: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: Colors.bgCardBorder, alignItems: 'center', justifyContent: 'center' },
  guiltBubbleActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  guiltText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  textarea: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.bgCardBorder, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base, minHeight: 80 },
  historyCard: { gap: Spacing.xs },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  badgePlanned: { backgroundColor: Colors.success + '30' },
  badgeSpontaneous: { backgroundColor: Colors.warning + '30' },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
