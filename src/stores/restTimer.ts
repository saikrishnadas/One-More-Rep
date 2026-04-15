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

  // HR-based rest timer mode
  hrMode: boolean;             // false = time-based, true = HR-based
  currentHr: number | null;    // current heart rate during rest
  recovered: boolean;          // true when HR drops below threshold
  maxHrThreshold: number;      // 60% of maxHR = recovery threshold

  start: (duration: number, exerciseName: string) => void;
  skip: () => void;
  adjust: (delta: number) => void;
  tick: () => void;
  stop: () => void;
  toggleHrMode: () => void;
  setCurrentHr: (bpm: number | null, userAge?: number) => void;
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  active: false,
  remaining: 0,
  duration: 0,
  exerciseName: '',
  intervalId: null,
  notificationId: null,

  // HR-based mode defaults
  hrMode: false,
  currentHr: null,
  recovered: false,
  maxHrThreshold: 0,

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

  toggleHrMode: () => {
    set((state) => ({ hrMode: !state.hrMode }));
  },

  setCurrentHr: (bpm, userAge) => {
    if (bpm === null) {
      set({ currentHr: null, recovered: false });
      return;
    }

    const { hrMode } = get();
    const maxHR = 220 - (userAge ?? 30);
    const threshold = maxHR * 0.60;

    if (hrMode) {
      set({
        currentHr: bpm,
        maxHrThreshold: threshold,
        recovered: bpm <= threshold,
      });
    } else {
      set({ currentHr: bpm, maxHrThreshold: threshold });
    }
  },
}));
