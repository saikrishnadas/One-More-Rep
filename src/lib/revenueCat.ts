import { Platform } from 'react-native';

// RevenueCat public API keys (safe to bundle in client code)
// Replace with real keys from https://app.revenuecat.com
const API_KEY_IOS = 'appl_YOUR_REVENUECAT_IOS_KEY';
const API_KEY_ANDROID = 'goog_YOUR_REVENUECAT_ANDROID_KEY';

export const PRODUCT_IDS = {
  monthly: 'gymbuddy_pro_monthly',
  yearly: 'gymbuddy_pro_yearly',
} as const;

export const ENTITLEMENT_ID = 'pro';

// Dev mode: skip RevenueCat, use mock purchases
export const USE_MOCK_SUBSCRIPTIONS = __DEV__;

let Purchases: any = null;

try {
  Purchases = require('react-native-purchases').default;
} catch {
  // Module not available
}

export async function initRevenueCat(appUserID?: string): Promise<void> {
  if (USE_MOCK_SUBSCRIPTIONS || !Purchases) return;

  try {
    Purchases.configure({
      apiKey: Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID,
      appUserID: appUserID ?? undefined,
    });
  } catch (e) {
    console.warn('RevenueCat init error:', e);
  }
}

export async function loginRevenueCat(userId: string): Promise<void> {
  if (USE_MOCK_SUBSCRIPTIONS || !Purchases) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('RevenueCat login error:', e);
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (USE_MOCK_SUBSCRIPTIONS || !Purchases) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn('RevenueCat logout error:', e);
  }
}

export { Purchases };
