import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Colors } from '@/lib/constants';

export default function AuthLayout() {
  const { session, isLoading } = useAuthStore();
  if (!isLoading && session) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />
  );
}
