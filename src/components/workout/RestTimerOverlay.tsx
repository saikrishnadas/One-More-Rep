// src/components/workout/RestTimerOverlay.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
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

/** Bar color: red (0-33%) → orange (33-66%) → green (66-100%) */
function recoveryBarColor(progress: number): string {
  if (progress < 33) return Colors.secondary;        // red
  if (progress < 66) return Colors.warning;          // orange/amber
  return Colors.success;                             // green
}

export function RestTimerOverlay() {
  const {
    remaining,
    duration,
    exerciseName,
    skip,
    adjust,
    hrMode,
    currentHr,
    recovered,
    maxHrThreshold,
    toggleHrMode,
  } = useRestTimerStore();

  // Animated scale for the "READY TO LIFT" banner
  const readyScale = useRef(new Animated.Value(0.8)).current;
  const prevRecoveredRef = useRef(false);

  useEffect(() => {
    if (recovered && !prevRecoveredRef.current) {
      // Trigger haptic feedback when recovered transitions to true
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Spring-animate the banner in
      Animated.spring(readyScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    } else if (!recovered) {
      readyScale.setValue(0.8);
    }
    prevRecoveredRef.current = recovered;
  }, [recovered, readyScale]);

  // Recovery bar progress calculation
  let recoveryProgress = 0;
  if (currentHr !== null && maxHrThreshold > 0) {
    const peakOffset = currentHr - maxHrThreshold;
    const total = (220 - 30) * 0.4; // typical working range above threshold
    recoveryProgress = Math.min(100, Math.max(0, 100 - (peakOffset / total * 100)));
  }

  const strokeDashoffset = CIRCUMFERENCE * (1 - remaining / (duration || 1));
  const ringColor = interpolateColor(remaining, duration);
  const barColor = recoveryBarColor(recoveryProgress);

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

        {/* HR Recovery section — shown when hrMode is true */}
        {hrMode && (
          <View style={styles.hrSection}>
            <Text style={styles.hrSectionTitle}>💓 Heart Rate Recovery</Text>

            {/* Current BPM vs target zone row */}
            <View style={styles.hrReadingsRow}>
              <View style={styles.hrBox}>
                <Text style={styles.hrBpmValue}>
                  {currentHr !== null ? currentHr : '--'}
                </Text>
                <Text style={styles.hrBoxLabel}>BPM</Text>
                <Text style={styles.hrBoxSubLabel}>current</Text>
              </View>

              <Text style={styles.hrArrow}>→</Text>

              <View style={styles.hrBox}>
                <Text style={[styles.hrBpmValue, styles.hrTargetValue]}>
                  {'< '}{maxHrThreshold > 0 ? Math.round(maxHrThreshold) : '--'}
                </Text>
                <Text style={styles.hrBoxLabel}>BPM</Text>
                <Text style={styles.hrBoxSubLabel}>ready zone</Text>
              </View>
            </View>

            {/* Recovery progress bar */}
            <View style={styles.recoveryBarWrapper}>
              <View style={styles.recoveryBarTrack}>
                <View
                  style={[
                    styles.recoveryBarFill,
                    { width: `${recoveryProgress}%` as any, backgroundColor: barColor },
                  ]}
                />
              </View>
              <Text style={styles.recoveryBarPercent}>
                {Math.round(recoveryProgress)}%
              </Text>
            </View>

            {/* READY TO LIFT banner */}
            {recovered && (
              <Animated.View style={[styles.readyBanner, { transform: [{ scale: readyScale }] }]}>
                <Text style={styles.readyBannerText}>🟢 READY TO LIFT ✅</Text>
              </Animated.View>
            )}
          </View>
        )}

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

        {/* HR mode toggle */}
        <TouchableOpacity style={styles.hrToggleBtn} onPress={toggleHrMode} activeOpacity={0.7}>
          <Text style={styles.hrToggleLabel}>
            {hrMode ? '⏱ Switch to Timer' : '💓 Switch to HR'}
          </Text>
        </TouchableOpacity>
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

  // HR toggle button
  hrToggleBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: 'transparent',
  },
  hrToggleLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },

  // HR recovery section
  hrSection: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  hrSectionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  hrReadingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  hrBox: {
    alignItems: 'center',
    minWidth: 72,
  },
  hrBpmValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    lineHeight: FontSize.xxxl + 4,
  },
  hrTargetValue: {
    color: Colors.success,
  },
  hrBoxLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  hrBoxSubLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  hrArrow: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
  },

  // Recovery bar
  recoveryBarWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recoveryBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCardBorder,
    overflow: 'hidden',
  },
  recoveryBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  recoveryBarPercent: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },

  // Ready to lift banner
  readyBanner: {
    backgroundColor: '#14532d',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.success,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  readyBannerText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.heavy,
    color: Colors.success,
    letterSpacing: 0.5,
  },
});
