import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  USE_MOCK_SUBSCRIPTIONS,
  ENTITLEMENT_ID,
  PRODUCT_IDS,
  Purchases,
} from '../lib/revenueCat';

interface SubscriptionState {
  isPro: boolean;
  trialUsed: boolean;
  isLoading: boolean;
  packages: any[];       // RevenueCat PurchasesPackage[] (typed as any to avoid import issues)
  error: string | null;

  checkSubscription: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  purchase: (planId?: 'monthly' | 'yearly') => Promise<void>;
  restore: () => Promise<void>;
  startTrial: (planId?: 'monthly' | 'yearly') => Promise<void>;
}

const STORAGE_KEY_IS_PRO = 'isPro';
const STORAGE_KEY_TRIAL_USED = 'trialUsed';

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: __DEV__ ? true : false,
  trialUsed: false,
  isLoading: false,
  packages: [],
  error: null,

  checkSubscription: async () => {
    if (USE_MOCK_SUBSCRIPTIONS) {
      // Dev mode: read from AsyncStorage (mock)
      const isProRaw = await AsyncStorage.getItem(STORAGE_KEY_IS_PRO);
      const trialUsedRaw = await AsyncStorage.getItem(STORAGE_KEY_TRIAL_USED);
      set({
        isPro: isProRaw === null ? true : isProRaw === 'true',
        trialUsed: trialUsedRaw === 'true',
      });
      return;
    }

    // Production: check RevenueCat entitlements
    if (!Purchases) return;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      set({ isPro });
    } catch (e) {
      console.warn('RevenueCat checkSubscription error:', e);
      // On error, keep current state — never lock user out
    }
  },

  fetchOfferings: async () => {
    if (USE_MOCK_SUBSCRIPTIONS || !Purchases) return;
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages) {
        set({ packages: offerings.current.availablePackages });
      }
    } catch (e) {
      console.warn('RevenueCat fetchOfferings error:', e);
    }
  },

  purchase: async (planId = 'yearly') => {
    if (USE_MOCK_SUBSCRIPTIONS) {
      set({ isLoading: true });
      await AsyncStorage.setItem(STORAGE_KEY_IS_PRO, 'true');
      set({ isPro: true, isLoading: false });
      return;
    }

    if (!Purchases) return;
    set({ isLoading: true, error: null });
    try {
      const { packages } = get();
      const productId = PRODUCT_IDS[planId];
      const pkg = packages.find((p: any) => p.product.identifier === productId);
      if (!pkg) throw new Error('Package not found — configure RevenueCat offerings');

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      set({ isPro, isLoading: false });
    } catch (e: any) {
      if (e.userCancelled) {
        set({ isLoading: false });
        return;
      }
      set({ isLoading: false, error: e.message ?? 'Purchase failed' });
    }
  },

  restore: async () => {
    if (USE_MOCK_SUBSCRIPTIONS) {
      await get().checkSubscription();
      return;
    }

    if (!Purchases) return;
    set({ isLoading: true, error: null });
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      set({ isPro, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? 'Restore failed' });
    }
  },

  startTrial: async (planId = 'yearly') => {
    if (USE_MOCK_SUBSCRIPTIONS) {
      set({ isLoading: true });
      await AsyncStorage.setItem(STORAGE_KEY_IS_PRO, 'true');
      await AsyncStorage.setItem(STORAGE_KEY_TRIAL_USED, 'true');
      set({ isPro: true, trialUsed: true, isLoading: false });
      return;
    }

    // RevenueCat/App Store handles free trials — just call purchase
    await get().purchase(planId);
  },
}));
