// src/stores/restTimer.ts
import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { scheduleRestNotification, cancelRestNotification } from '@/lib/notifications';

interface RestTimerState {
  active: boolean;
  remaining: number;       // seconds
  duration: number;        // total seconds
  exerciseName: string;
  intervalId: ReturnType<typeof setInterval> | null;
  notificationId: string | null;

  start: (duration: number, exerciseName: string) => void;
  skip: () => void;
  adjust: (delta: number) => void;
  tick: () => void;
  stop: () => void;
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  active: false,
  remaining: 0,
  duration: 0,
  exerciseName: '',
  intervalId: null,
  notificationId: null,

  start: (duration, exerciseName) => {
    // Clear any existing interval
    const existing = get().intervalId;
    if (existing !== null) {
      clearInterval(existing);
    }

    // Cancel any existing scheduled notification
    const existingNotifId = get().notificationId;
    if (existingNotifId !== null) {
      cancelRestNotification(existingNotifId).catch(() => {});
    }

    const intervalId = setInterval(() => {
      get().tick();
    }, 1000);

    set({
      active: true,
      remaining: duration,
      duration,
      exerciseName,
      intervalId,
      notificationId: null,
    });

    // Schedule notification and store the ID
    scheduleRestNotification(duration)
      .then((id) => {
        set({ notificationId: id });
      })
      .catch(() => {});
  },

  tick: () => {
    const { remaining } = get();
    if (remaining <= 1) {
      get().stop();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      set({ remaining: remaining - 1 });
    }
  },

  stop: () => {
    const { intervalId, notificationId } = get();
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    if (notificationId !== null) {
      cancelRestNotification(notificationId).catch(() => {});
    }
    set({
      active: false,
      intervalId: null,
      notificationId: null,
    });
  },

  skip: () => {
    get().stop();
  },

  adjust: (delta) => {
    const { remaining, duration } = get();
    const clamped = Math.min(Math.max(remaining + delta, 5), duration + 60);
    set({ remaining: clamped });
  },
}));
