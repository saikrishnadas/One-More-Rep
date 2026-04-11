import React from 'react';
import { Text } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Colors } from '@/lib/constants';

function TabIcon({ icon, active }: { icon: string; active: boolean }) {
  return <Text style={{ fontSize: 20, opacity: active ? 1 : 0.45 }}>{icon}</Text>;
}

export default function TabsLayout() {
  const { session, isLoading } = useAuthStore();
  if (!isLoading && !session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#2a2a2a',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Home',      tabBarIcon: ({ focused }) => <TabIcon icon="🏠" active={focused} /> }} />
      <Tabs.Screen name="workout"   options={{ title: 'Workout',   tabBarIcon: ({ focused }) => <TabIcon icon="💪" active={focused} /> }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition', tabBarIcon: ({ focused }) => <TabIcon icon="🥗" active={focused} /> }} />
      <Tabs.Screen name="social"    options={{ title: 'Social',    tabBarIcon: ({ focused }) => <TabIcon icon="👥" active={focused} /> }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profile',   tabBarIcon: ({ focused }) => <TabIcon icon="👤" active={focused} /> }} />
    </Tabs>
  );
}
