import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing } from '@/lib/constants';

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: Spacing.xl }}>
        <Text variant="heading">Workout History</Text>
        <Text variant="caption" style={{ marginTop: Spacing.sm }}>
          Your workouts will appear here. Tap Start Workout on the Home tab to begin.
        </Text>
      </View>
    </SafeAreaView>
  );
}
