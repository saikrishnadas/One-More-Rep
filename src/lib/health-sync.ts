import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

export interface HealthData {
  stepsToday: number;
  stepsAvailable: boolean;
}

/** Get today's step count using expo-sensors Pedometer */
export async function getTodaySteps(): Promise<HealthData> {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      return { stepsToday: 0, stepsAvailable: false };
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    const result = await Pedometer.getStepCountAsync(start, end);
    return { stepsToday: result.steps, stepsAvailable: true };
  } catch {
    return { stepsToday: 0, stepsAvailable: false };
  }
}

/** Subscribe to live step count updates */
export function subscribeToSteps(onUpdate: (steps: number) => void): { remove: () => void } {
  return Pedometer.watchStepCount(result => {
    onUpdate(result.steps);
  });
}

/** Estimate calories burned from steps (rough: ~0.04 kcal per step) */
export function stepsToCalories(steps: number, weightKg: number = 70): number {
  return Math.round(steps * 0.04 * (weightKg / 70));
}

/** Format step count nicely */
export function formatSteps(steps: number): string {
  if (steps >= 1000) return `${(steps / 1000).toFixed(1)}k`;
  return String(steps);
}
