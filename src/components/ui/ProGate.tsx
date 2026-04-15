import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSubscriptionStore } from '@/stores/subscription';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
  compact?: boolean;
}

const openPaywall = () => router.push('/paywall' as any);

export function ProGate({ children, feature, compact = false }: ProGateProps) {
  const { isPro } = useSubscriptionStore();

  if (isPro) {
    return <>{children}</>;
  }

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={openPaywall} activeOpacity={0.8}>
        <Crown size={14} color={Colors.primary} />
        <Text style={styles.compactLabel}>Pro Feature</Text>
        <View style={styles.compactButton}>
          <Text style={styles.compactButtonText}>Upgrade</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.fullCard} onPress={openPaywall} activeOpacity={0.8}>
      <View style={styles.crownContainer}>
        <Crown size={32} color={Colors.primary} />
      </View>

      <Text style={styles.title}>Voltrep Pro</Text>

      {feature ? (
        <Text style={styles.featureName}>{feature}</Text>
      ) : null}

      <Text style={styles.pricing}>₹299/month · ₹1,999/year</Text>
      <Text style={styles.trialSubtitle}>Tap to see plans & start free trial</Text>
    </TouchableOpacity>
  );
}

/** Locked preview variant: renders children at low opacity with a Pro badge overlay */
export function ProLock({ children }: { children: React.ReactNode }) {
  const { isPro } = useSubscriptionStore();

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <View style={styles.lockWrapper}>
      <View style={styles.lockedContent}>{children}</View>
      <View style={styles.lockBadge}>
        <Text style={styles.lockBadgeText}>🔒 Pro</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Full card ────────────────────────────────────────────────────────────────
  fullCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary}99`, // #f97316 at ~60% opacity
    padding: Spacing.xl,
    alignItems: 'center',
  },
  crownContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  featureName: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  pricing: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  trialSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  loader: {
    marginTop: Spacing.md,
  },
  buttonStack: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
  },
  secondaryButton: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },

  // ── Compact card ─────────────────────────────────────────────────────────────
  compactCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}99`,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compactLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  compactButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  compactButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
  },

  // ── Lock overlay ─────────────────────────────────────────────────────────────
  lockWrapper: {
    position: 'relative',
  },
  lockedContent: {
    opacity: 0.3,
  },
  lockBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  lockBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
});
