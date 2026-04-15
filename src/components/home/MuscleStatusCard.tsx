import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/constants";
import {
  getMuscleRecovery,
  MuscleRecovery,
  RecoveryStatus,
} from "@/lib/muscle-recovery";
import { useHealthPlatformStore } from '@/stores/healthPlatform';
import { useSubscriptionStore } from '@/stores/subscription';
import { router } from 'expo-router';

interface Props {
  userId: string;
  goal?: string | null;
}

const STATUS_CONFIG: Record<
  RecoveryStatus,
  { emoji: string; color: string; label: string }
> = {
  fresh: { emoji: "🟢", color: Colors.success, label: "Fresh" },
  recovering: { emoji: "🟡", color: Colors.warning, label: "Recovering" },
  fatigued: { emoji: "🔴", color: Colors.secondary, label: "Fatigued" },
};

interface MuscleEntry {
  name: string;
  data: MuscleRecovery;
}

export function MuscleStatusCard({ userId, goal }: Props) {
  const [muscles, setMuscles] = useState<MuscleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const readinessScore = useHealthPlatformStore((s) => s.readinessScore);
  const readinessData = useHealthPlatformStore((s) => s.readinessData);
  const isPro = useSubscriptionStore((s) => s.isPro);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getMuscleRecovery(userId, goal, { readinessScore, isPro })
      .then((record) => {
        const entries = Object.entries(record).map(([name, data]) => ({
          name,
          data,
        }));
        setMuscles(entries);
      })
      .finally(() => setLoading(false));
  }, [userId, goal, readinessScore, isPro]);

  function handleChipPress(entry: MuscleEntry) {
    const { name, data } = entry;
    const cfg = STATUS_CONFIG[data.status];
    const detail =
      data.status === "fresh" && data.trainedHoursAgo === 0
        ? "Fully recovered"
        : data.readyInHours === 0
          ? "Fully recovered"
          : `Trained ${data.trainedHoursAgo}h ago, ready in ${data.readyInHours}h`;
    Alert.alert(
      `${cfg.emoji} ${name.toUpperCase()}`,
      `${cfg.label} — ${data.recoveryPct}% recovered\n${detail}`,
    );
  }

  return (
    <Card style={styles.card}>
      <Text variant="label" style={styles.title}>
        💪 Muscle Status
      </Text>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.chipsRow}
        >
          {muscles.map((entry) => {
            const cfg = STATUS_CONFIG[entry.data.status];
            return (
              <TouchableOpacity
                key={entry.name}
                style={[
                  styles.chip,
                  {
                    borderColor: cfg.color,
                    backgroundColor: cfg.color + "33",
                  },
                ]}
                onPress={() => handleChipPress(entry)}
                activeOpacity={0.7}
              >
                <View style={[styles.dot, { backgroundColor: cfg.color }]} />
                <Text style={[styles.chipText, { color: Colors.textPrimary }]}>
                  {entry.name}
                </Text>
                {/* <Text style={styles.chipEmoji}>{cfg.emoji}</Text> */}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* PRO lock banner for free users */}
      {!isPro && (
        <TouchableOpacity
          style={{ marginTop: 8, paddingVertical: 6, paddingHorizontal: 12 }}
          onPress={() => router.push('/paywall' as any)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 11, color: '#666666' }}>
            🔒 PRO: Smart recovery using your sleep & HRV data
          </Text>
        </TouchableOpacity>
      )}

      {/* Watch note for Pro users missing sleep data */}
      {isPro && readinessData && readinessData.sleepHours === null && (
        <Text style={{ marginTop: 8, fontSize: 11, color: '#9ca3af', paddingHorizontal: 12 }}>
          ⌚ Wear your watch to sleep for more accurate recovery data
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold as any },
  loader: { paddingVertical: Spacing.md },
  scroll: { marginHorizontal: -Spacing.sm },
  chipsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium as any,
    textTransform: "capitalize",
  },
  chipEmoji: {
    fontSize: FontSize.sm,
  },
});
