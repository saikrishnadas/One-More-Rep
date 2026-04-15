import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { initDatabase } from '@/db/client';
import { seedExercises } from '@/db/seed';
import { Colors } from '@/lib/constants';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications, setupNotificationCategories } from '@/lib/notifications';
import { useHabitStore } from '@/stores/habits';
import { formatDate } from '@/lib/utils';
import { useSubscriptionStore } from '@/stores/subscription';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { setSession, fetchProfile } = useAuthStore();

  useEffect(() => {
    // Hydrate subscription store so isPro is available immediately
    useSubscriptionStore.getState().checkSubscription();

    // Initialize local DB and seed exercises
    initDatabase().then(() => seedExercises());
    registerForPushNotifications().catch(console.warn);

    // Listen for auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setupNotificationCategories();

    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'habit_checkin' && data?.habitId) {
        if (response.actionIdentifier === 'DONE') {
          const userId = useAuthStore.getState().user?.id;
          if (userId) {
            await useHabitStore.getState().toggleHabit(userId, data.habitId, formatDate(new Date()));
          }
        }
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="active-workout" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="workout-summary" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="nutrition-goals" options={{ presentation: 'modal' }} />
          <Stack.Screen name="nutrition-report" options={{ presentation: 'card' }} />
          <Stack.Screen name="workout-stats" options={{ presentation: 'card' }} />
          <Stack.Screen name="measurements" options={{ presentation: 'card' }} />
          <Stack.Screen name="ai-chat" options={{ presentation: 'card' }} />
          <Stack.Screen name="privacy-policy" options={{ presentation: 'card' }} />
          <Stack.Screen name="export" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile-settings" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="progress-report" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="cheat-day" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="goal-estimate" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="progress-photos" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
