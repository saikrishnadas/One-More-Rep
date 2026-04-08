import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@/lib/constants';

interface CardProps extends ViewProps {
  accent?: boolean;
}

export function Card({ accent, style, children, ...props }: CardProps) {
  return (
    <View
      style={[styles.card, accent && styles.accent, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: Spacing.lg,
  },
  accent: {
    borderColor: Colors.primaryDim,
  },
});
