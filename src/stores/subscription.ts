import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionState {
  isPro: boolean;
  trialUsed: boolean;
  isLoading: boolean;

  checkSubscription: () => Promise<void>;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
  startTrial: () => Promise<void>;
}

const STORAGE_KEY_IS_PRO = 'isPro';
const STORAGE_KEY_TRIAL_USED = 'trialUsed';

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: true, // DEV: default true for testing
  trialUsed: false,
  isLoading: false,

  checkSubscription: async () => {
    const isProRaw = await AsyncStorage.getItem(STORAGE_KEY_IS_PRO);
    const trialUsedRaw = await AsyncStorage.getItem(STORAGE_KEY_TRIAL_USED);
    set({
      // DEV: default to true if never set — remove this fallback in production
      isPro: isProRaw === null ? true : isProRaw === 'true',
      trialUsed: trialUsedRaw === 'true',
    });
  },

  purchase: async () => {
    set({ isLoading: true });
    await AsyncStorage.setItem(STORAGE_KEY_IS_PRO, 'true');
    set({ isPro: true, isLoading: false });
  },

  restore: async () => {
    await get().checkSubscription();
  },

  startTrial: async () => {
    set({ isLoading: true });
    await AsyncStorage.setItem(STORAGE_KEY_IS_PRO, 'true');
    await AsyncStorage.setItem(STORAGE_KEY_TRIAL_USED, 'true');
    set({ isPro: true, trialUsed: true, isLoading: false });
  },
}));
