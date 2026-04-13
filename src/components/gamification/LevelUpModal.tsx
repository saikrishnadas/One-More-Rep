import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { getLevelTitle } from '@/lib/utils';

interface Props {
  visible: boolean;
  oldLevel: number;
  newLevel: number;
  onDismiss: () => void;
}

export function LevelUpModal({ visible, oldLevel, newLevel, onDismiss }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.gradient}
          >
            <Text style={styles.emoji}>⚡</Text>
            <Text style={styles.levelUpText}>LEVEL UP!</Text>
            <Text style={styles.levelNum}>Level {newLevel}</Text>
            <Text style={styles.title}>{getLevelTitle(newLevel)}</Text>
            <Text style={styles.sub}>You've grown from Level {oldLevel}</Text>
          </LinearGradient>
          <View style={styles.footer}>
            <Button label="AWESOME!" onPress={onDismiss} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  gradient: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emoji: { fontSize: 64 },
  levelUpText: { fontSize: FontSize.sm, fontWeight: FontWeight.heavy, color: 'rgba(255,255,255,0.8)', letterSpacing: 4 },
  levelNum: { fontSize: 48, fontWeight: FontWeight.heavy, color: '#fff' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: '#fff' },
  sub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.sm },
  footer: { backgroundColor: Colors.bgCard, padding: Spacing.xl },
});
