import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, Dumbbell, Apple, Users, User } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth';
import { Colors } from '@/lib/constants';

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
      <Tabs.Screen name="index"     options={{ title: 'Home',      tabBarIcon: ({ color, size }) => <Home      color={color} size={22} /> }} />
      <Tabs.Screen name="workout"   options={{ title: 'Workout',   tabBarIcon: ({ color, size }) => <Dumbbell  color={color} size={22} /> }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition', tabBarIcon: ({ color, size }) => <Apple     color={color} size={22} /> }} />
      <Tabs.Screen name="social"    options={{ title: 'Social',    tabBarIcon: ({ color, size }) => <Users     color={color} size={22} /> }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profile',   tabBarIcon: ({ color, size }) => <User      color={color} size={22} /> }} />
    </Tabs>
  );
}
