import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { BadgeDef } from '@/lib/xp-service';

interface Props {
  badge: BadgeDef | null;
  onDone: () => void;
}

export function BadgeToast({ badge, onDone }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;
    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(2500),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      translateY.setValue(-100);
      opacity.setValue(0);
      onDone();
    });
  }, [badge]);

  if (!badge) return null;

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY }], opacity }]}>
      <Text style={styles.icon}>{badge.icon}</Text>
      <View>
        <Text style={styles.unlocked}>Badge Unlocked!</Text>
        <Text style={styles.name}>{badge.name}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 60, left: Spacing.xl, right: Spacing.xl,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.primary,
    borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: Spacing.md, zIndex: 999,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  icon: { fontSize: 32 },
  unlocked: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.heavy, letterSpacing: 1 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
