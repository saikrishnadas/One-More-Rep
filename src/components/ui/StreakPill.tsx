import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

interface StreakPillProps {
  days: number;
}

export function StreakPill({ days }: StreakPillProps) {
  return (
    <LinearGradient
      colors={['#f97316', '#ef4444']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.pill}
    >
      <Text style={styles.text}>🔥 {days} day streak</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
});
