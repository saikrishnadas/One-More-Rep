import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isHealthPlatformAvailable,
  requestHealthPermissions,
  writeWorkout,
  subscribeHeartRate,
  getReadinessData,
  getHRZone,
  readStepCount,
  type HRZone,
  type WorkoutData,
  type ReadinessData,
} from '../lib/health-platform';
import { formatDate } from '../lib/utils';

// Module-level variable for the heart rate unsubscribe function (not persisted)
let hrUnsubscribe: (() => void) | null = null;

interface HealthPlatformState {
  connected: boolean;
  hasPermission: boolean;
  liveHeartRate: number | null;
  heartRateZone: HRZone | null;
  readinessScore: number | null;
  readinessLabel: 'High' | 'Moderate' | 'Low' | null;
  readinessData: ReadinessData | null;
  isLoadingReadiness: boolean;

  requestPermission: (userAge: number) => Promise<void>;
  startHeartRateMonitoring: (userAge: number) => void;
  stopHeartRateMonitoring: () => void;
  fetchReadiness: (userAge: number) => Promise<void>;
  writeWorkoutToHealth: (data: WorkoutData) => Promise<void>;
  getTodaySteps: () => Promise<number>;
  disconnect: () => void;
}

export const useHealthPlatformStore = create<HealthPlatformState>()(
  persist(
    (set, get) => ({
      connected: false,
      hasPermission: false,
      liveHeartRate: null,
      heartRateZone: null,
      readinessScore: null,
      readinessLabel: null,
      readinessData: null,
      isLoadingReadiness: false,

      requestPermission: async (_userAge: number) => {
        if (!isHealthPlatformAvailable()) return;

        const granted = await requestHealthPermissions();
        if (granted) {
          set({ connected: true, hasPermission: true });
        } else {
          set({ hasPermission: false });
        }
      },

      startHeartRateMonitoring: (userAge: number) => {
        // Stop any existing subscription before starting a new one
        if (hrUnsubscribe !== null) {
          hrUnsubscribe();
          hrUnsubscribe = null;
        }

        const unsubscribe = subscribeHeartRate((bpm: number) => {
          set({
            liveHeartRate: bpm,
            heartRateZone: getHRZone(bpm, userAge),
          });
        });

        hrUnsubscribe = unsubscribe;
      },

      stopHeartRateMonitoring: () => {
        if (hrUnsubscribe !== null) {
          hrUnsubscribe();
          hrUnsubscribe = null;
        }
        set({ liveHeartRate: null, heartRateZone: null });
      },

      fetchReadiness: async (userAge: number) => {
        set({ isLoadingReadiness: true });

        const data = await getReadinessData();

        const { sleepHours, hrv, restingHr, hrvSevenDayAvg, restingHrSevenDayAvg } = data;

        let score = 0;

        // Sleep score
        if (sleepHours !== null) {
          if (sleepHours >= 7) score += 40;
          else if (sleepHours >= 6) score += 25;
          else if (sleepHours > 0) score += 10;
        }

        // HRV score
        if (hrv && hrvSevenDayAvg) {
          if (hrv >= hrvSevenDayAvg) score += 30;
          else if (hrv >= hrvSevenDayAvg * 0.85) score += 15;
          else score += 5;
        }

        // Resting HR score (lower is better)
        if (restingHr && restingHrSevenDayAvg) {
          if (restingHr <= restingHrSevenDayAvg) score += 30;
          else if (restingHr <= restingHrSevenDayAvg * 1.05) score += 15;
          else score += 5;
        }

        // Compute readiness label
        let readinessLabel: 'High' | 'Moderate' | 'Low';
        if (score >= 80) readinessLabel = 'High';
        else if (score >= 50) readinessLabel = 'Moderate';
        else readinessLabel = 'Low';

        set({
          readinessData: data,
          readinessScore: score,
          readinessLabel,
          isLoadingReadiness: false,
        });
      },

      writeWorkoutToHealth: async (data: WorkoutData) => {
        const { connected, hasPermission } = get();
        if (connected && hasPermission) {
          try {
            await writeWorkout(data);
          } catch {
            // Ignore errors
          }
        }
      },

      getTodaySteps: async () => {
        const { connected, hasPermission } = get();
        if (connected && hasPermission) {
          return readStepCount(formatDate(new Date()));
        }
        return 0;
      },

      disconnect: () => {
        get().stopHeartRateMonitoring();
        set({
          connected: false,
          hasPermission: false,
          readinessScore: null,
          readinessLabel: null,
          readinessData: null,
          liveHeartRate: null,
          heartRateZone: null,
          isLoadingReadiness: false,
        });
      },
    }),
    {
      name: 'health-platform-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        connected: state.connected,
        hasPermission: state.hasPermission,
      }),
    },
  ),
);
