import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Activity } from 'lucide-react-native'
import { useHealthPlatformStore } from '../../stores/healthPlatform'
import { useSubscriptionStore } from '../../stores/subscription'
import { ProGate } from '../ui/ProGate'
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../lib/constants'

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Push Hard Today'
  if (score >= 50) return 'Normal Workout'
  return 'Consider Rest Day'
}

function ScoreRing({ score }: { score: number }) {
  const size = 80
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const scoreColor = getScoreColor(score)

  return (
    <View style={styles.ringContainer}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2a2a2a"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Score arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringLabelContainer}>
        <Text style={[styles.ringScore, { color: scoreColor }]}>{score}</Text>
      </View>
    </View>
  )
}

export function ReadinessCard() {
  const { isPro } = useSubscriptionStore()
  const {
    connected,
    readinessScore,
    readinessLabel,
    readinessData,
    isLoadingReadiness,
    requestPermission,
  } = useHealthPlatformStore()

  if (!isPro) {
    return null
  }

  if (!connected) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>🌙 Recovery Score</Text>
        </View>
        <Text style={styles.disconnectedSubtext}>
          Connect Apple Health to unlock
        </Text>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => requestPermission(30)}
          activeOpacity={0.8}
        >
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isLoadingReadiness) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Recovery Score</Text>
        </View>
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      </View>
    )
  }

  if (readinessScore === null) {
    return null
  }

  const labelColor = getScoreColor(readinessScore)
  const message = getScoreMessage(readinessScore)

  const sleepHours = readinessData?.sleepHours ?? null
  const hrv = readinessData?.hrv ?? null
  const restingHr = readinessData?.restingHr ?? null

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Recovery Score</Text>
        <View style={[styles.labelBadge, { backgroundColor: `${labelColor}22` }]}>
          <Activity size={12} color={labelColor} />
          <Text style={[styles.labelBadgeText, { color: labelColor }]}>
            {readinessLabel}
          </Text>
        </View>
      </View>

      <View style={styles.gaugeRow}>
        <ScoreRing score={readinessScore} />
      </View>

      <Text style={[styles.message, { color: labelColor }]}>{message}</Text>

      {(sleepHours !== null || hrv !== null || restingHr !== null) && (
        <View style={styles.pillsRow}>
          {sleepHours !== null && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>💤 {sleepHours.toFixed(1)}h</Text>
            </View>
          )}
          {hrv !== null && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>📊 {Math.round(hrv)}ms HRV</Text>
            </View>
          )}
          {restingHr !== null && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>❤️ {Math.round(restingHr)}bpm</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  labelBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  gaugeRow: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  ringContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.heavy,
  },
  message: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  pill: {
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
  },
  pillText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  disconnectedSubtext: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  connectButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
  },
  loader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
})
