import React from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { BADGES } from '@/lib/xp-service';
import { EarnedBadge } from '@/stores/gamification';

interface Props {
  earnedBadges: EarnedBadge[];
}

export function BadgeShelf({ earnedBadges }: Props) {
  const earnedIds = new Set(earnedBadges.map(b => b.badgeId));

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text variant="title">Badges</Text>
        <Text variant="caption">{earnedBadges.length} / {BADGES.length}</Text>
      </View>
      <View style={styles.grid}>
        {BADGES.map((badge) => {
          const isEarned = earnedIds.has(badge.id);
          return (
            <TouchableOpacity
              key={badge.id}
              style={[styles.badge, !isEarned && styles.badgeLocked]}
              onPress={() => {
                if (!isEarned) {
                  Alert.alert(
                    `🔒 ${badge.name}`,
                    `How to unlock:\n${badge.description}`,
                    [{ text: 'Got it', style: 'default' }]
                  );
                }
              }}
              activeOpacity={isEarned ? 1 : 0.7}
            >
              <Text style={styles.badgeIcon}>{isEarned ? badge.icon : '🔒'}</Text>
              <Text style={[styles.badgeName, !isEarned && styles.badgeNameLocked]} numberOfLines={2}>
                {badge.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badge: {
    width: 72, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: Spacing.xs,
  },
  badgeLocked: { opacity: 0.35 },
  badgeIcon: { fontSize: 26 },
  badgeName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  badgeNameLocked: { color: Colors.textMuted },
});
