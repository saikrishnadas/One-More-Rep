import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { formatDuration, formatVolume } from '@/lib/utils';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444', back: '#3b82f6', shoulders: '#a855f7',
  biceps: '#f59e0b', triceps: '#f97316', quads: '#22c55e',
  hamstrings: '#06b6d4', glutes: '#ec4899', calves: '#84cc16',
  abs: '#f97316', traps: '#6366f1',
};

interface ShareCardProps {
  username: string;
  durationSeconds: number;
  totalVolumeKg: number;
  setCount: number;
  prCount: number;
  xpEarned: number;
  muscles: string[];
}

export const ShareCard = React.forwardRef<View, ShareCardProps>(
  ({ username, durationSeconds, totalVolumeKg, setCount, prCount, xpEarned, muscles }, ref) => {
    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.flame}>🔥</Text>
          <View>
            <Text style={styles.appName}>VOLTREP</Text>
            <Text style={styles.username}>@{username}</Text>
          </View>
          {prCount > 0 && (
            <View style={styles.prBadge}>
              <Text style={styles.prText}>🏆 PR</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{formatVolume(totalVolumeKg)}</Text>
            <Text style={styles.statUnit}>kg volume</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{formatDuration(durationSeconds)}</Text>
            <Text style={styles.statUnit}>duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{setCount}</Text>
            <Text style={styles.statUnit}>sets</Text>
          </View>
        </View>

        {/* XP */}
        <View style={styles.xpRow}>
          <Text style={styles.xpText}>⚡ +{xpEarned} XP earned</Text>
        </View>

        {/* Muscles */}
        {muscles.length > 0 && (
          <View style={styles.muscleRow}>
            {muscles.slice(0, 5).map((m) => (
              <View
                key={m}
                style={[
                  styles.muscleChip,
                  {
                    backgroundColor: (MUSCLE_COLORS[m] ?? Colors.primary) + '30',
                    borderColor: MUSCLE_COLORS[m] ?? Colors.primary,
                  },
                ]}
              >
                <Text style={[styles.muscleText, { color: MUSCLE_COLORS[m] ?? Colors.primary }]}>
                  {m}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>voltrep.app · Track. Train. Dominate.</Text>
      </View>
    );
  }
);

ShareCard.displayName = 'ShareCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111111',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
    padding: Spacing.xl,
    gap: Spacing.md,
    width: 340,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  flame: { fontSize: 32 },
  appName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.heavy,
    color: Colors.primary,
    letterSpacing: 3,
  },
  username: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  prBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  prText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.bgCardBorder,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.bgCardBorder,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
  },
  statUnit: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpRow: {
    backgroundColor: Colors.bgHighlight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  xpText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  muscleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  muscleText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  footer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
