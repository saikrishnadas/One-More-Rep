import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { Heart } from 'lucide-react-native'
import { useHealthPlatformStore } from '../../stores/healthPlatform'
import { useSubscriptionStore } from '../../stores/subscription'
import { getHRZoneInfo } from '../../lib/health-platform'
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../lib/constants'

export default function HeartRateCard() {
  const isPro = useSubscriptionStore((s) => s.isPro)
  const { connected, liveHeartRate, heartRateZone } = useHealthPlatformStore()

  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!liveHeartRate) return
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 300, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [liveHeartRate])

  // State 1: Not Pro
  if (!isPro) {
    return null
  }

  // State 2: Pro, not connected
  if (!connected) {
    return (
      <Text style={styles.connectHint}>⌚ Connect Apple Watch for live heart rate</Text>
    )
  }

  // State 3: Pro, connected, no HR yet
  if (!liveHeartRate) {
    return (
      <View style={styles.container}>
        <Heart size={16} color={Colors.textSecondary} />
        <Text style={styles.bpmNumber}>—</Text>
        <Text style={styles.bpmLabel}>BPM</Text>
      </View>
    )
  }

  // State 4: Pro, connected, has HR
  const zoneInfo = heartRateZone ? getHRZoneInfo(heartRateZone) : null

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Heart size={16} color={Colors.secondary} fill={Colors.secondary} />
      </Animated.View>
      <Text style={styles.bpmNumber}>{liveHeartRate}</Text>
      <Text style={styles.bpmLabel}>BPM</Text>
      {zoneInfo && (
        <View
          style={[
            styles.zonePill,
            {
              backgroundColor: zoneInfo.color + '33',
              borderColor: zoneInfo.color,
            },
          ]}
        >
          <Text style={[styles.zoneLabel, { color: zoneInfo.color }]}>
            {zoneInfo.label}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  connectHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    gap: Spacing.xs,
  },
  bpmNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  bpmLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  zonePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginLeft: Spacing.xs,
  },
  zoneLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
})
