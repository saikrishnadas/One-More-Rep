import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useHabitStore } from '@/stores/habits';
import { useGamificationStore } from '@/stores/gamification';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HabitGrid } from '@/components/habits/HabitGrid';
import { CreateHabitModal } from '@/components/habits/CreateHabitModal';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { BadgeToast } from '@/components/gamification/BadgeToast';
import { BadgeShelf } from '@/components/gamification/BadgeShelf';
import { XpBar } from '@/components/gamification/XpBar';
import { Check, X, Ruler, Upload, Flame, Dumbbell, Frown, Target, Settings, TrendingUp, Camera, Heart } from 'lucide-react-native';
import { HabitIcon } from '@/components/ui/HabitIcon';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { syncHabits } from '@/lib/habit-sync';
import { scheduleStreakAlert, cancelHabitReminder, scheduleHabitReminderInteractive } from '@/lib/notifications';
import { useHealthPlatformStore } from '../../src/stores/healthPlatform';
import { useSubscriptionStore } from '../../src/stores/subscription';
import { ProGate } from '../../src/components/ui/ProGate';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { habits, logs, loadHabits, loadLogs, createHabit, deleteHabit, toggleHabit } = useHabitStore();
  const { earnedBadges, pendingLevelUp, pendingBadges, loadBadges, setPendingLevelUp, clearPendingBadge } = useGamificationStore();
  const { connected, hasPermission, requestPermission, disconnect } = useHealthPlatformStore();
  const { isPro } = useSubscriptionStore();
  const userAge = 30;
  const [showCreate, setShowCreate] = useState(false);

  const today = formatDate(new Date());

  useEffect(() => {
    if (!user) return;
    loadHabits(user.id);
    loadLogs(user.id);
    loadBadges(user.id);
  }, [user]);

  async function handleToggle(habitId: string) {
    if (!user) return;
    await toggleHabit(user.id, habitId, today);
    syncHabits(user.id).catch(console.warn);
  }

  async function handleCreate(data: Parameters<typeof createHabit>[1]) {
    if (!user) return;
    await createHabit(user.id, data);
    syncHabits(user.id).catch(console.warn);
    // After createHabit call, reload habits to get the new habit's ID
    await loadHabits(user.id);
    const newHabit = useHabitStore.getState().habits.find(h => h.name === data.name);
    if (newHabit) {
      if (newHabit.reminderTime) {
        await scheduleHabitReminderInteractive(newHabit.id, newHabit.name, newHabit.reminderTime).catch(console.warn);
      } else {
        await scheduleStreakAlert(newHabit.id, newHabit.name).catch(console.warn);
      }
    }
  }

  function handleDelete(habitId: string, name: string) {
    Alert.alert('Delete Habit', `Delete "${name}"? This removes all history.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteHabit(habitId); cancelHabitReminder(habitId).catch(console.warn); } },
    ]);
  }

  function getStreak(habitId: string): number {
    let streak = 0;
    const todayDate = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const date = formatDate(d);
      const log = logs.find(l => l.habitId === habitId && l.date === date);
      if (log?.completed) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  }

  const todayLogs = logs.filter(l => l.date === today && l.completed);
  const disciplineScore = habits.length > 0
    ? Math.round((todayLogs.length / habits.length) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="heading">{profile?.username ?? 'Profile'}</Text>
            <XpBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/profile-settings')} style={styles.settingsLink}>
          <Card style={styles.settingsCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Settings size={18} color={Colors.textPrimary} />
              <Text style={styles.settingsText}>Edit Profile & Settings</Text>
            </View>
            <Text variant="caption">Goal, weight, fitness level, diet →</Text>
          </Card>
        </TouchableOpacity>

        {/* Today's discipline */}
        {habits.length > 0 && (
          <Card style={styles.disciplineCard}>
            <View style={styles.disciplineRow}>
              <View>
                <Text variant="label">Today's Discipline</Text>
                <Text variant="heading" color={disciplineScore >= 80 ? Colors.success : disciplineScore >= 50 ? Colors.warning : Colors.secondary}>
                  {disciplineScore}%
                </Text>
              </View>
              <View style={styles.disciplineEmoji}>
                {disciplineScore >= 80
                  ? <Flame size={36} color={Colors.success} />
                  : disciplineScore >= 50
                  ? <Dumbbell size={36} color={Colors.warning} />
                  : <Frown size={36} color={Colors.secondary} />}
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {
                width: `${disciplineScore}%` as any,
                backgroundColor: disciplineScore >= 80 ? Colors.success : disciplineScore >= 50 ? Colors.warning : Colors.secondary,
              }]} />
            </View>
            <Text variant="caption" style={{ marginTop: Spacing.xs }}>
              {todayLogs.length} / {habits.length} habits completed today
            </Text>
          </Card>
        )}

        {/* Health Platform Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health & Fitness Watch</Text>
          <ProGate feature="Watch & Health Integration" compact>
            <TouchableOpacity
              style={[styles.linkCard, connected && styles.linkCardConnected]}
              onPress={() => !connected ? requestPermission(userAge) : undefined}
              activeOpacity={connected ? 1 : 0.7}
            >
              <View style={styles.linkCardLeft}>
                <View style={styles.linkIconContainer}>
                  <Heart size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.linkCardTitle}>
                    {Platform.OS === 'ios' ? 'Apple Health' : 'Google Health'}
                  </Text>
                  <Text style={styles.linkCardSubtitle}>
                    {connected
                      ? 'Workouts, live HR & recovery insights'
                      : 'Connect to unlock watch features'
                    }
                  </Text>
                </View>
              </View>
              <View style={styles.healthStatus}>
                {connected ? (
                  <>
                    <Text style={styles.connectedText}>✓ Connected</Text>
                    <TouchableOpacity onPress={disconnect} style={styles.disconnectBtn}>
                      <Text style={styles.disconnectText}>Disconnect</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.connectText}>Connect →</Text>
                )}
              </View>
            </TouchableOpacity>
          </ProGate>
        </View>

        {/* Habits section */}
        <View style={styles.sectionHeader}>
          <Text variant="title">Habits</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text variant="body" style={{ textAlign: 'center', marginBottom: Spacing.md }}>
              No habits yet. Build discipline one habit at a time!
            </Text>
            <Button label="Create First Habit" onPress={() => setShowCreate(true)} variant="secondary" />
          </Card>
        )}

        {habits.map((habit) => {
          const todayLog = logs.find(l => l.habitId === habit.id && l.date === today);
          const isDone = todayLog?.completed ?? false;
          const streak = getStreak(habit.id);

          return (
            <Card key={habit.id} style={styles.habitCard}>
              <View style={styles.habitHeader}>
                <TouchableOpacity onPress={() => handleToggle(habit.id)} style={styles.habitCheck}>
                  <View style={[styles.checkCircle, isDone && styles.checkCircleDone]}>
                    {isDone && <Check size={14} color={Colors.success} />}
                  </View>
                  <View style={styles.habitInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <HabitIcon name={habit.icon} size={18} color={Colors.textSecondary} />
                      <Text style={styles.habitName}>{habit.name}</Text>
                    </View>
                    {streak > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Flame size={12} color={Colors.primary} />
                        <Text variant="caption" color={Colors.primary}>{streak} day streak</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(habit.id, habit.name)} style={styles.deleteBtn}>
                  <X size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.gridContainer}>
                <HabitGrid habitId={habit.id} logs={logs} />
              </View>
            </Card>
          );
        })}

        {/* Badge shelf */}
        <View style={styles.badgeSection}>
          <BadgeShelf earnedBadges={earnedBadges} />
        </View>

        {/* Body & Measurements link */}
        <TouchableOpacity onPress={() => router.push('/measurements')} style={styles.measurementsLink}>
          <Card style={styles.measurementsCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ruler size={18} color={Colors.textPrimary} />
              <Text style={styles.measurementsText}>Body & Measurements</Text>
            </View>
            <Text variant="caption">Weight log, measurements, body fat estimate →</Text>
          </Card>
        </TouchableOpacity>

        {/* 10-Day Progress Report link */}
        <TouchableOpacity onPress={() => router.push('/progress-report')}>
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <TrendingUp size={18} color={Colors.primary} />
              <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>10-Day Progress Report</Text>
            </View>
            <Text variant="caption">AI-powered summary of your last 10 days →</Text>
          </Card>
        </TouchableOpacity>

        {/* Goal Date Estimate link */}
        <TouchableOpacity onPress={() => router.push('/goal-estimate')}>
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Target size={18} color={Colors.primary} />
              <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>Goal Date Estimate</Text>
            </View>
            <Text variant="caption">When will you reach your goal? →</Text>
          </Card>
        </TouchableOpacity>

        {/* Progress Photos link */}
        <TouchableOpacity onPress={() => router.push('/progress-photos')}>
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Camera size={18} color={Colors.textPrimary} />
              <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>Progress Photos</Text>
            </View>
            <Text variant="caption">Visual transformation timeline →</Text>
          </Card>
        </TouchableOpacity>

        {/* Export My Data link */}
        <TouchableOpacity onPress={() => router.push('/export')} style={styles.exportLink}>
          <Card style={styles.exportCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Upload size={18} color={Colors.textPrimary} />
              <Text style={styles.exportText}>Export My Data</Text>
            </View>
            <Text variant="caption">Download workouts & nutrition as CSV →</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/privacy-policy')} style={styles.privacyLink}>
          <Text style={styles.privacyLinkText}>Privacy Policy · Terms of Use</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      <CreateHabitModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />

      <LevelUpModal
        visible={!!pendingLevelUp}
        oldLevel={pendingLevelUp?.oldLevel ?? 1}
        newLevel={pendingLevelUp?.newLevel ?? 2}
        onDismiss={() => setPendingLevelUp(null)}
      />

      <BadgeToast
        badge={pendingBadges[0] ?? null}
        onDone={clearPendingBadge}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  signOutBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  signOutText: { fontSize: FontSize.sm, color: Colors.textMuted },
  disciplineCard: { gap: Spacing.sm },
  disciplineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  disciplineEmoji: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  progressBar: { height: 6, backgroundColor: Colors.bgCardBorder, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  addBtn: { backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  addBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  habitCard: { gap: Spacing.md },
  habitHeader: { flexDirection: 'row', alignItems: 'center' },
  habitCheck: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.bgCardBorder, alignItems: 'center', justifyContent: 'center' },
  checkCircleDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  habitInfo: { flex: 1 },
  habitName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  deleteBtn: { padding: Spacing.sm },
  gridContainer: { marginTop: Spacing.xs },
  badgeSection: { marginTop: Spacing.md },
  measurementsLink: {},
  measurementsCard: { gap: 4 },
  measurementsText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  exportLink: {},
  exportCard: { gap: 4 },
  exportText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  privacyLink: { alignItems: 'center', paddingVertical: Spacing.md },
  privacyLinkText: { fontSize: FontSize.xs, color: Colors.textMuted },
  settingsLink: {},
  settingsCard: { gap: 4 },
  settingsText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  linkCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkCardConnected: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  linkCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  linkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  linkCardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  healthStatus: { flexDirection: 'column', alignItems: 'flex-end', gap: Spacing.xs },
  connectedText: { fontSize: FontSize.sm, color: Colors.success, fontWeight: FontWeight.medium },
  disconnectBtn: { paddingVertical: 2 },
  disconnectText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  connectText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
});
