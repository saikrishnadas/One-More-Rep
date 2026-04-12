import React, { useState, useRef, useEffect } from 'react';
import {
  View, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useOnboardingStore } from '@/stores/onboarding';
import { useWorkoutStore } from '@/stores/workout';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { sendChatMessage } from '@/lib/ai-trainer';
import { getMuscleRecovery } from '@/lib/muscle-recovery';
import { MUSCLE_GROUPS, generateWorkoutPlan, WorkoutPlan, MuscleGroupKey } from '@/lib/coach-planner';
import type { ChatMessage } from '@/lib/ai-trainer';
import { ChevronLeft, Zap, MessageCircle, Dumbbell, CheckCircle } from 'lucide-react-native';

const RECOVERY_COLOR: Record<string, string> = {
  fresh: Colors.success,
  recovering: Colors.warning,
  fatigued: Colors.secondary,
};

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Hey! I'm Coach. Ask me anything about workouts, nutrition, recovery, or training strategy.",
};

function PlanTab() {
  const { user, profile } = useAuthStore();
  const { data: onboarding } = useOnboardingStore();
  const { startWorkout, addExercise } = useWorkoutStore();

  const [recoveryMap, setRecoveryMap] = useState<Record<string, { status: string; recoveryPct: number }>>({});
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroupKey | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [addedToWorkout, setAddedToWorkout] = useState(false);

  useEffect(() => {
    if (user) getMuscleRecovery(user.id, profile?.goal).then(setRecoveryMap as any).catch(() => {});
  }, [user]);

  async function handleGeneratePlan() {
    if (!selectedMuscle || !selectedSection || !user) return;
    setLoading(true);
    setPlan(null);
    try {
      const result = await generateWorkoutPlan(
        user.id,
        selectedMuscle,
        selectedSection,
        onboarding?.fitnessLevel ?? 'intermediate',
        profile?.goal ?? null,
        recoveryMap
      );
      setPlan(result);
    } catch (e) {
      Alert.alert('Error', 'Could not generate plan. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleAddToWorkout() {
    if (!plan || !user) return;
    startWorkout();
    for (const ex of plan.exercises) {
      addExercise({
        id: ex.exerciseId,
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
      });
    }
    setAddedToWorkout(true);
    setTimeout(() => router.push('/active-workout'), 300);
  }

  const muscleGroup = MUSCLE_GROUPS.find(g => g.key === selectedMuscle);

  return (
    <ScrollView contentContainerStyle={styles.planContent}>
      <Text variant="label" style={styles.stepLabel}>1. Which muscle group today?</Text>
      <View style={styles.muscleGrid}>
        {MUSCLE_GROUPS.map(group => {
          const recovery = recoveryMap[group.key];
          const statusColor = recovery ? RECOVERY_COLOR[recovery.status] ?? Colors.textMuted : Colors.textMuted;
          const isSelected = selectedMuscle === group.key;
          return (
            <TouchableOpacity
              key={group.key}
              style={[styles.muscleChip, isSelected && styles.muscleChipSelected, { borderColor: isSelected ? Colors.primary : statusColor }]}
              onPress={() => { setSelectedMuscle(group.key); setSelectedSection(null); setPlan(null); setAddedToWorkout(false); }}
            >
              <Text style={[styles.muscleChipText, isSelected && { color: Colors.primary }]}>{group.label}</Text>
              {recovery && (
                <View style={[styles.recoveryDot, { backgroundColor: statusColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedMuscle && recoveryMap[selectedMuscle] && (
        <Card style={styles.recoveryNote}>
          <Text variant="caption" color={RECOVERY_COLOR[recoveryMap[selectedMuscle].status]}>
            {recoveryMap[selectedMuscle].status === 'fatigued'
              ? `${selectedMuscle} is fatigued — consider a lighter session or rest`
              : recoveryMap[selectedMuscle].status === 'recovering'
              ? `${selectedMuscle} is still recovering — moderate intensity recommended`
              : `${selectedMuscle} is fresh and ready to train hard!`}
          </Text>
        </Card>
      )}

      {muscleGroup && (
        <>
          <Text variant="label" style={styles.stepLabel}>2. Focus area?</Text>
          <View style={styles.sectionRow}>
            {muscleGroup.sections.map(sec => (
              <TouchableOpacity
                key={sec}
                style={[styles.sectionChip, selectedSection === sec && styles.sectionChipSelected]}
                onPress={() => { setSelectedSection(sec); setPlan(null); setAddedToWorkout(false); }}
              >
                <Text style={[styles.sectionChipText, selectedSection === sec && { color: Colors.primary }]}>{sec}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {selectedMuscle && selectedSection && !plan && !loading && (
        <Button label="Generate My Workout" onPress={handleGeneratePlan} />
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
          <Text variant="caption" style={{ marginTop: Spacing.sm }}>Coach is building your plan…</Text>
        </View>
      )}

      {plan && (
        <View style={styles.planResult}>
          <Card style={{ gap: Spacing.sm }}>
            <Text variant="title" color={Colors.primary}>{plan.title}</Text>
            <Text variant="caption">{plan.coachNote}</Text>
          </Card>

          {plan.exercises.map((ex, i) => (
            <Card key={i} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Dumbbell size={14} color={Colors.primary} />
                <Text variant="title" style={{ flex: 1 }}>{ex.name}</Text>
                <Text style={styles.setsReps}>{ex.sets} × {ex.reps}</Text>
              </View>
              {ex.suggestedWeightKg > 0 && (
                <Text variant="caption" color={Colors.info}>Suggested: {ex.suggestedWeightKg} kg</Text>
              )}
              {ex.notes ? <Text variant="caption">{ex.notes}</Text> : null}
            </Card>
          ))}

          {addedToWorkout ? (
            <View style={styles.addedRow}>
              <CheckCircle size={18} color={Colors.success} />
              <Text style={styles.addedText}>Added to workout!</Text>
            </View>
          ) : (
            <Button label="Start This Workout" onPress={handleAddToWorkout} />
          )}

          <TouchableOpacity onPress={() => { setSelectedSection(null); setPlan(null); }} style={styles.resetBtn}>
            <Text style={styles.resetText}>← Change focus</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function ChatTab() {
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context] = useState({
    username: profile?.username ?? 'Athlete',
    goal: profile?.goal ?? null,
    level: profile?.level ?? 1,
    weeklyWorkouts: 0,
    totalVolumeKg: 0,
    recentMuscles: [] as string[],
  });
  const listRef = useRef<FlatList>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    try {
      const reply = await sendChatMessage(newMessages.slice(-10), context);
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Connection issue — try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            {item.role === 'assistant' && <Text style={styles.coachLabel}>COACH</Text>}
            <Text style={[styles.bubbleText, item.role === 'user' && styles.userBubbleText]}>{item.content}</Text>
          </View>
        )}
        ListFooterComponent={loading ? (
          <View style={[styles.bubble, styles.aiBubble]}><ActivityIndicator color={Colors.primary} size="small" /></View>
        ) : null}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask Coach anything..."
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={loading || !input.trim()}
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function CoachScreen() {
  const [tab, setTab] = useState<'plan' | 'chat'>('plan');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Zap size={16} color={Colors.primary} />
            <Text variant="title">Coach AI</Text>
          </View>
          <Text variant="caption">Personal Trainer Mode</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'plan' && styles.tabBtnActive]}
          onPress={() => setTab('plan')}
        >
          <Dumbbell size={14} color={tab === 'plan' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabBtnText, tab === 'plan' && { color: Colors.primary }]}>Get Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'chat' && styles.tabBtnActive]}
          onPress={() => setTab('chat')}
        >
          <MessageCircle size={14} color={tab === 'chat' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabBtnText, tab === 'chat' && { color: Colors.primary }]}>Chat</Text>
        </TouchableOpacity>
      </View>

      {tab === 'plan' ? <PlanTab /> : <ChatTab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.bgCardBorder },
  backBtn: { width: 40 },
  headerTitle: { alignItems: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.bgCardBorder },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted },
  planContent: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  stepLabel: { marginBottom: Spacing.xs },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  muscleChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.bgCardBorder, backgroundColor: Colors.bgCard, flexDirection: 'row', alignItems: 'center', gap: 6 },
  muscleChipSelected: { backgroundColor: Colors.bgHighlight },
  muscleChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  recoveryDot: { width: 8, height: 8, borderRadius: 4 },
  recoveryNote: { paddingVertical: Spacing.sm },
  sectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  sectionChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.bgCardBorder, backgroundColor: Colors.bgCard },
  sectionChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  sectionChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  center: { alignItems: 'center', paddingVertical: Spacing.xl },
  planResult: { gap: Spacing.md },
  exerciseCard: { gap: Spacing.xs },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  setsReps: { fontSize: FontSize.sm, fontWeight: FontWeight.heavy, color: Colors.primary },
  addedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  addedText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.success },
  resetBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  resetText: { fontSize: FontSize.sm, color: Colors.textMuted },
  messageList: { padding: Spacing.xl, gap: Spacing.md },
  bubble: { maxWidth: '82%', padding: Spacing.md, borderRadius: Radius.lg, gap: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder, borderBottomLeftRadius: Radius.sm },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.primary, borderBottomRightRadius: Radius.sm },
  coachLabel: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.heavy, letterSpacing: 1 },
  bubbleText: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 20 },
  userBubbleText: { color: Colors.textPrimary },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.md, paddingHorizontal: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.bgCardBorder, backgroundColor: Colors.bg },
  input: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder, borderRadius: Radius.lg, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base, maxHeight: 120 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.bgCardBorder },
  sendIcon: { fontSize: FontSize.lg, fontWeight: FontWeight.heavy, color: '#fff' },
});
