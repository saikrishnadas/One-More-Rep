import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing } from '@/lib/constants';

export default function NutritionScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: Spacing.xl }}>
        <Text variant="heading">Nutrition</Text>
        <Text variant="caption" style={{ marginTop: Spacing.sm }}>Coming in Phase 3.</Text>
      </View>
    </SafeAreaView>
  );
}
