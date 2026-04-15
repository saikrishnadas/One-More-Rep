import { Stack, Redirect, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Colors } from '@/lib/constants';

export default function AuthLayout() {
  const { session, profile, isLoading } = useAuthStore();
  const segments = useSegments();

  // If logged in and NOT on the onboarding screen, check if onboarding is done
  const isOnOnboarding = segments.includes('onboarding' as any);

  if (!isLoading && session && !isOnOnboarding) {
    // Only redirect to tabs if user has completed onboarding (has a goal set)
    if (profile?.goal) {
      return <Redirect href="/(tabs)" />;
    }
    // No profile/goal yet — send to onboarding
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />
  );
}
