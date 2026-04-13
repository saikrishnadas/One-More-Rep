// src/components/workout/RestTimerOverlay.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useRestTimerStore } from '@/stores/restTimer';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/lib/constants';

const DIAMETER = 200;
const RADIUS = 88;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Linearly interpolate from orange (#f97316) to red (#ef4444) based on progress drained */
function interpolateColor(remaining: number, duration: number): string {
  if (duration === 0) return Colors.primary;
  const progress = 1 - remaining / duration; // 0 at start, 1 at end
  // orange r=249,g=115,b=22  →  red r=239,g=68,b=68
  const r = Math.round(249 + (239 - 249) * progress);
  const g = Math.round(115 + (68 - 115) * progress);
  const b = Math.round(22 + (68 - 22) * progress);
  return `rgb(${r},${g},${b})`;
}

export function RestTimerOverlay() {
  const { remaining, duration, exerciseName, skip, adjust } = useRestTimerStore();

  const strokeDashoffset = CIRCUMFERENCE * (1 - remaining / (duration || 1));
  const ringColor = interpolateColor(remaining, duration);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.content} pointerEvents="auto">
        {/* Circular SVG ring */}
        <View style={styles.ringContainer}>
          <Svg width={DIAMETER} height={DIAMETER}>
            {/* Background track */}
            <Circle
              cx={DIAMETER / 2}
              cy={DIAMETER / 2}
              r={RADIUS}
              stroke={Colors.bgCard}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress arc — drains clockwise: rotate so 12-o'clock is start */}
            <Circle
              cx={DIAMETER / 2}
              cy={DIAMETER / 2}
              r={RADIUS}
              stroke={ringColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              rotation="-90"
              origin={`${DIAMETER / 2}, ${DIAMETER / 2}`}
            />
          </Svg>

          {/* Centered text */}
          <View style={styles.ringTextContainer}>
            <Text style={styles.countdownText}>{remaining}</Text>
            <Text variant="caption">seconds</Text>
          </View>
        </View>

        {/* Exercise name */}
        <Text variant="title" style={styles.exerciseName} numberOfLines={1}>
          {exerciseName}
        </Text>
        <Text variant="caption" style={styles.subtitle}>Rest Timer</Text>

        {/* Control buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => adjust(-30)}
            activeOpacity={0.8}
          >
            <Text style={styles.adjustLabel}>−30s</Text>
          </TouchableOpacity>

          <Button
            label="SKIP REST"
            onPress={skip}
            variant="primary"
            style={styles.skipBtn}
          />

          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => adjust(30)}
            activeOpacity={0.8}
          >
            <Text style={styles.adjustLabel}>+30s</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.xl,
  },
  ringContainer: {
    width: DIAMETER,
    height: DIAMETER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    lineHeight: FontSize.display + 4,
  },
  exerciseName: {
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: -Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  adjustBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: 'transparent',
    minWidth: 64,
    alignItems: 'center',
  },
  adjustLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.xxl,
  },
});
