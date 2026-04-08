import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '@/lib/constants';

type Variant = 'display' | 'heading' | 'title' | 'body' | 'caption' | 'label';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: keyof typeof FontWeight;
}

const styles = StyleSheet.create({
  display:  { fontSize: FontSize.display, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  heading:  { fontSize: FontSize.xxl,    fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  title:    { fontSize: FontSize.lg,     fontWeight: FontWeight.bold,  color: Colors.textPrimary },
  body:     { fontSize: FontSize.base,   fontWeight: FontWeight.normal,color: Colors.textPrimary },
  caption:  { fontSize: FontSize.sm,     fontWeight: FontWeight.normal,color: Colors.textSecondary },
  label:    { fontSize: FontSize.xs,     fontWeight: FontWeight.bold,  color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
});

export function Text({ variant = 'body', color, weight, style, ...props }: AppTextProps) {
  return (
    <RNText
      style={[
        styles[variant],
        color ? { color } : undefined,
        weight ? { fontWeight: FontWeight[weight] } : undefined,
        style,
      ]}
      {...props}
    />
  );
}
