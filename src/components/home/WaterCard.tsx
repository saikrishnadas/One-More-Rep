import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useWaterStore } from '@/stores/water';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/lib/constants';
import { Settings, X } from 'lucide-react-native';

export function WaterCard() {
  const { todayIntakeMl, goalMl, addWater, loadToday, setGoal } = useWaterStore();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const pct = goalMl > 0 ? Math.min(todayIntakeMl / goalMl, 1) : 0;
  const isComplete = pct >= 1;

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const animatedBarStyle = {
    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
  };

  function handleOpenGoalEdit() {
    setGoalInput(String(goalMl));
    setEditingGoal(true);
  }

  function handleSaveGoal() {
    const ml = parseInt(goalInput, 10);
    if (!isNaN(ml) && ml > 0) setGoal(ml);
    setEditingGoal(false);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text variant="label">💧 Water Intake</Text>
        <TouchableOpacity onPress={handleOpenGoalEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Settings size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {editingGoal && (
        <View style={styles.goalEditRow}>
          <TextInput
            style={styles.goalInput}
            value={goalInput}
            onChangeText={setGoalInput}
            keyboardType="number-pad"
            placeholder="Goal in ml"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            selectTextOnFocus
          />
          <TouchableOpacity style={styles.goalSaveBtn} onPress={handleSaveGoal}>
            <Text style={styles.goalSaveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditingGoal(false)} style={{ padding: Spacing.xs }}>
            <X size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: isComplete ? Colors.success : Colors.info },
            animatedBarStyle,
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <Text variant="caption">
          {todayIntakeMl} ml of {goalMl} ml
        </Text>
        <Text
          style={[
            styles.pctText,
            { color: isComplete ? Colors.success : Colors.info },
          ]}
        >
          {Math.round(pct * 100)}%
        </Text>
      </View>

      <View style={styles.buttonsRow}>
        {[250, 500, 750].map((ml) => (
          <TouchableOpacity
            key={ml}
            style={styles.addButton}
            onPress={() => addWater(ml)}
            activeOpacity={0.75}
          >
            <Text style={styles.addButtonText}>+{ml} ml</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 8,
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pctText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addButton: {
    flex: 1,
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  goalEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  goalInput: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.info,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  goalSaveBtn: {
    backgroundColor: Colors.info,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  goalSaveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
});
