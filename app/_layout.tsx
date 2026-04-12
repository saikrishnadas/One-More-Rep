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
import { registerForPushNotifications } from '@/lib/notifications';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { setSession, fetchProfile } = useAuthStore();

  useEffect(() => {
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
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
