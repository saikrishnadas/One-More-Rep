import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useSubscriptionStore } from '@/stores/subscription';
import { PRODUCT_IDS } from '@/lib/revenueCat';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/lib/constants';

type Plan = 'monthly' | 'yearly';

const FEATURES = [
  { emoji: '⌚', text: 'Live Heart Rate & HR Zones' },
  { emoji: '💪', text: 'Readiness-Adjusted weight suggestions' },
  { emoji: '🔄', text: 'Smart muscle recovery (sleep + HRV)' },
  { emoji: '📊', text: 'Workout Intensity Score & trends' },
  { emoji: '🕐', text: 'Best Training Window analysis' },
  { emoji: '🤖', text: 'Unlimited AI coach messages' },
  { emoji: '📋', text: 'Weekly AI Training Report' },
  { emoji: '📈', text: 'Sleep-Performance Correlation' },
  { emoji: '📤', text: 'Data export (CSV)' },
  { emoji: '🏃', text: 'Hyrox Training', comingSoon: true },
] as const;

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const { isPro, trialUsed, isLoading, purchase, restore, startTrial, packages, fetchOfferings } = useSubscriptionStore();

  // Fetch real pricing from RevenueCat on mount
  useEffect(() => {
    fetchOfferings();
  }, []);

  // Dynamic prices from RevenueCat (fallback to hardcoded)
  const monthlyPkg = packages.find((p: any) => p.product?.identifier === PRODUCT_IDS.monthly);
  const yearlyPkg = packages.find((p: any) => p.product?.identifier === PRODUCT_IDS.yearly);
  const monthlyPrice = monthlyPkg?.product?.priceString ?? '₹299';
  const yearlyPrice = yearlyPkg?.product?.priceString ?? '₹1,999';

  const handleCTA = async () => {
    if (!trialUsed) {
      await startTrial(selectedPlan);
    } else {
      await purchase(selectedPlan);
    }
    // Only dismiss if purchase succeeded
    if (useSubscriptionStore.getState().isPro) {
      router.back();
    }
  };

  const handleRestore = async () => {
    await restore();
    if (useSubscriptionStore.getState().isPro) {
      router.back();
    }
  };

  const planLabel = selectedPlan === 'yearly' ? 'Yearly plan' : 'Monthly plan';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* X close button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.7}>
        <X size={22} color={Colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Crown / star icon */}
        <Text style={styles.crownEmoji}>👑</Text>

        {/* Title */}
        <Text variant="display" style={styles.title}>Unlock Gym Buddy PRO</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Train smarter with your watch data</Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={[styles.featureRow, 'comingSoon' in feature && feature.comingSoon && { opacity: 0.5 }]}>
              <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              <Text style={styles.featureText}>
                {feature.text}{'comingSoon' in feature && feature.comingSoon ? ' (Coming Soon)' : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Plan toggle */}
        <View style={styles.planToggle}>
          {/* Monthly card */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'monthly' ? styles.planCardSelected : styles.planCardUnselected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <Text style={styles.planName}>Monthly</Text>
            <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceSelected]}>
              {monthlyPrice}
            </Text>
            <Text style={styles.planPeriod}>/month</Text>
          </TouchableOpacity>

          {/* Yearly card */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'yearly' ? styles.planCardSelected : styles.planCardUnselected,
            ]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 44%</Text>
            </View>
            <Text style={styles.planName}>Yearly</Text>
            <Text style={[styles.planPrice, selectedPlan === 'yearly' && styles.planPriceSelected]}>
              {yearlyPrice}
            </Text>
            <Text style={styles.planPeriod}>/year</Text>
          </TouchableOpacity>
        </View>

        {/* CTA button */}
        <Button
          label={!trialUsed ? 'Start 7-Day Free Trial' : 'Subscribe Now'}
          onPress={handleCTA}
          loading={isLoading}
          style={styles.ctaButton}
        />

        {/* Restore purchase link */}
        <TouchableOpacity onPress={handleRestore} activeOpacity={0.7} style={styles.restoreButton}>
          <Text style={styles.restoreText}>Restore Purchase</Text>
        </TouchableOpacity>

        {/* Fine print */}
        {!trialUsed && (
          <Text style={styles.finePrint}>
            Cancel anytime. Trial converts to {planLabel} after 7 days.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: Spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  crownEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 80,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
    gap: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  featureEmoji: {
    fontSize: FontSize.lg,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  planToggle: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  planCard: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 2,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    position: 'relative',
    minHeight: 110,
    justifyContent: 'center',
    gap: 2,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  planCardUnselected: {
    borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.bgCard,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold as any,
    color: '#fff',
    letterSpacing: 0.3,
  },
  planName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium as any,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.heavy as any,
    color: Colors.textPrimary,
  },
  planPriceSelected: {
    color: Colors.primary,
  },
  planPeriod: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  ctaButton: {
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
  },
  restoreButton: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  restoreText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  finePrint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.md,
  },
});
