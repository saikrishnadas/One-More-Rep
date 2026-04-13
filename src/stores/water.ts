import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDate } from '@/lib/utils';

interface WaterState {
  todayIntakeMl: number;
  goalMl: number;
  lastDate: string;
  addWater: (ml: number) => Promise<void>;
  resetDay: () => Promise<void>;
  loadToday: () => Promise<void>;
  setGoal: (ml: number) => Promise<void>;
}

export const useWaterStore = create<WaterState>((set, get) => ({
  todayIntakeMl: 0,
  goalMl: 2500,
  lastDate: '',

  loadToday: async () => {
    // Load goal
    const goalRaw = await AsyncStorage.getItem('water_goal');
    const goalMl = goalRaw ? parseInt(goalRaw, 10) : 2500;
    set({ goalMl });

    const today = formatDate(new Date());
    const { lastDate } = get();

    // Reset if date changed
    if (lastDate !== today) {
      await get().resetDay();
    }

    // Load today's intake
    const intakeRaw = await AsyncStorage.getItem(`water_${today}`);
    const todayIntakeMl = intakeRaw ? parseInt(intakeRaw, 10) : 0;
    set({ todayIntakeMl });
  },

  addWater: async (ml: number) => {
    const today = formatDate(new Date());
    const { lastDate } = get();

    // Reset if date changed
    if (lastDate !== today) {
      await get().resetDay();
    }

    const newIntake = get().todayIntakeMl + ml;
    set({ todayIntakeMl: newIntake });
    await AsyncStorage.setItem(`water_${today}`, String(newIntake));
  },

  resetDay: async () => {
    const today = formatDate(new Date());
    set({ todayIntakeMl: 0, lastDate: today });
    await AsyncStorage.setItem(`water_${today}`, '0');
  },

  setGoal: async (ml: number) => {
    set({ goalMl: ml });
    await AsyncStorage.setItem('water_goal', String(ml));
  },
}));
