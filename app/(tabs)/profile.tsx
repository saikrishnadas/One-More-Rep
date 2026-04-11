import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';
import { Colors, Spacing } from '@/lib/constants';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: Spacing.xl, gap: Spacing.lg }}>
        <Text variant="heading">{profile?.username ?? 'Profile'}</Text>
        <Text variant="caption">Stats, habits, and badges coming in upcoming phases.</Text>
        <Button label="Sign Out" onPress={signOut} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}
