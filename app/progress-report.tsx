import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useAuthStore } from '@/stores/auth';
import { generateReport, PeriodReport } from '@/lib/report-generator';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { ChevronLeft, TrendingUp, Dumbbell, Flame, Target, Utensils } from 'lucide-react-native';

function MiniBarChart({ data }: { data: { label: string; volume: number }[] }) {
  const max = Math.max(...data.map(d => d.volume), 1);
  const W = 280;
  const H = 60;
  const barW = Math.floor(W / data.length) - 4;

  return (
    <Svg width={W} height={H + 16}>
      {data.map((d, i) => {
        const barH = max > 0 ? Math.max(2, (d.volume / max) * H) : 2;
        const x = i * (barW + 4);
        const y = H - barH;
        return (
          <React.Fragment key={d.label}>
            <Rect x={x} y={y} width={barW} height={barH} rx={3} fill={d.volume > 0 ? Colors.primary : Colors.bgCardBorder} />
            <SvgText x={x + barW / 2} y={H + 12} fontSize={8} fill={Colors.textMuted} textAnchor="middle">{d.label}</SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function ProgressReportScreen() {
  const { user } = useAuthStore();
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    generateReport(user.id)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text variant="heading" style={{ flex: 1, textAlign: 'center' }}>10-Day Report</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text variant="caption" style={{ marginTop: Spacing.md }}>Generating your report…</Text>
        </View>
      ) : !report ? (
        <View style={styles.center}><Text variant="body">No data yet — complete some workouts first!</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="caption" style={styles.period}>{report.periodStart} → {report.periodEnd}</Text>

          <View style={styles.statsGrid}>
            {[
              { icon: <Dumbbell size={18} color={Colors.primary} />, label: 'Workouts', value: String(report.workoutsCompleted) },
              { icon: <TrendingUp size={18} color={Colors.info} />, label: 'Volume', value: `${Math.round(report.totalVolumeKg)} kg` },
              { icon: <Flame size={18} color={Colors.warning} />, label: 'Avg Session', value: `${report.avgSessionDurationMin}m` },
              { icon: <Target size={18} color={Colors.success} />, label: 'Habit %', value: `${report.habitCompletionPct}%` },
            ].map(s => (
              <Card key={s.label} style={styles.statCard}>
                {s.icon}
                <Text style={styles.statValue}>{s.value}</Text>
                <Text variant="caption">{s.label}</Text>
              </Card>
            ))}
          </View>

          <Card>
            <Text variant="title" style={styles.cardTitle}>Volume Trend (10 days)</Text>
            <MiniBarChart data={report.volumeTrend} />
          </Card>

          <Card style={{ gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Utensils size={16} color={Colors.info} />
              <Text variant="title">Nutrition Avg</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={styles.macroBlock}>
                <Text style={styles.macroValue}>{report.avgCalories}</Text>
                <Text variant="caption">kcal/day</Text>
              </View>
              <View style={styles.macroBlock}>
                <Text style={styles.macroValue}>{report.avgProteinG}g</Text>
                <Text variant="caption">protein/day</Text>
              </View>
            </View>
          </Card>

          {report.newPRs.length > 0 && (
            <Card style={{ gap: Spacing.sm }}>
              <Text variant="title">New PRs 🏆</Text>
              {report.newPRs.map((pr, i) => (
                <View key={i} style={styles.prRow}>
                  <Text variant="body">{pr.exercise}</Text>
                  <Text style={styles.prValue}>{pr.weightKg} kg × {pr.reps}</Text>
                </View>
              ))}
            </Card>
          )}

          {report.topMuscles.length > 0 && (
            <Card style={{ gap: Spacing.sm }}>
              <Text variant="title">Most Trained Muscles</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
                {report.topMuscles.map(m => (
                  <View key={m} style={styles.muscleChip}>
                    <Text style={styles.muscleChipText}>{m}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {report.weightChange != null && (
            <Card style={{ gap: 4 }}>
              <Text variant="title">Body Weight</Text>
              <Text style={[styles.weightChange, { color: report.weightChange <= 0 ? Colors.success : Colors.warning }]}>
                {report.weightChange > 0 ? '+' : ''}{report.weightChange.toFixed(1)} kg this period
              </Text>
            </Card>
          )}

          <Card style={{ gap: Spacing.md }}>
            <Text variant="label" color={Colors.primary}>Coach Says</Text>
            <Text variant="body" style={{ lineHeight: 22 }}>{report.aiNarrative}</Text>
          </Card>

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  period: { textAlign: 'center', marginBottom: Spacing.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: { width: '47%', alignItems: 'center', gap: 4, paddingVertical: Spacing.lg },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  cardTitle: { marginBottom: Spacing.md },
  macroBlock: { alignItems: 'center', gap: 4 },
  macroValue: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.info },
  prRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  muscleChip: {
    backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.primary,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  muscleChipText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold, textTransform: 'capitalize' },
  weightChange: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy },
});
