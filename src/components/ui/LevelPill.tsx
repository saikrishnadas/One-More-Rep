import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

interface LevelPillProps {
  level: number;
}

export function LevelPill({ level }: LevelPillProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>⚡ LVL {level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.bgHighlight,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
