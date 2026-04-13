import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { xpForLevel, getLevelTitle } from '@/lib/utils';

interface Props {
  xp: number;
  level: number;
}

export function XpBar({ xp, level }: Props) {
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = Math.min((xp - currentLevelXp) / (nextLevelXp - currentLevelXp), 1);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.levelLabel}>⚡ LVL {level} · {getLevelTitle(level)}</Text>
        <Text style={styles.xpText}>{xp} / {nextLevelXp} XP</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(progress * 100, 2)}%` as any }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  levelLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  xpText: { fontSize: FontSize.sm, color: Colors.textMuted },
  track: { height: 6, backgroundColor: Colors.bgCardBorder, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },
});
