/**
 * health-platform.ts
 *
 * Unified health platform wrapper that abstracts HealthKit (iOS) and
 * Health Connect (Android) behind a single API.
 *
 * Every function is wrapped in try/catch and returns safe fallback values
 * on error — this module will never throw or crash the app.
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Safe module imports — guarded so a missing native module never hard-crashes
// ---------------------------------------------------------------------------

// iOS: react-native-health
let AppleHealthKit: any = null;
let HealthKitPermissions: any = null;
let HKWorkoutActivityType: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnHealth = require('react-native-health');
  AppleHealthKit = rnHealth.default ?? rnHealth.AppleHealthKit ?? rnHealth;
  HealthKitPermissions = rnHealth.HealthKitPermissions;
  HKWorkoutActivityType = rnHealth.HKWorkoutActivityType;
} catch {
  // Module unavailable — all iOS paths will fall through to safe defaults
}

// Android: react-native-health-connect
let HealthConnect: {
  initialize: () => Promise<boolean>;
  requestPermission: (perms: any[]) => Promise<any>;
  readRecords: (type: string, opts: any) => Promise<any>;
  insertRecords: (records: any[]) => Promise<any>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnHC = require('react-native-health-connect');
  HealthConnect = {
    initialize: rnHC.initialize,
    requestPermission: rnHC.requestPermission,
    readRecords: rnHC.readRecords,
    insertRecords: rnHC.insertRecords,
  };
} catch {
  // Module unavailable — all Android paths will fall through to safe defaults
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface HeartRateSample {
  bpm: number;
  timestamp: Date;
}

export interface SleepData {
  totalHours: number;
  deepHours: number;
  remHours: number;
  date: string;
}

export interface HRVData {
  average: number; // ms
  samples: Array<{ value: number; date: string }>;
  sevenDayAvg: number;
}

export interface RestingHRData {
  value: number; // bpm
  sevenDayAvg: number;
}

export interface WorkoutData {
  startDate: Date;
  endDate: Date;
  workoutType: 'traditionalStrengthTraining'; // iOS type
  calories?: number;
  totalVolume?: number;
}

export interface WorkoutHRData {
  averageHR: number | null;
  peakHR: number | null;
  zones: {
    z1: { minutes: number; percentage: number };
    z2: { minutes: number; percentage: number };
    z3: { minutes: number; percentage: number };
    z4: { minutes: number; percentage: number };
    z5: { minutes: number; percentage: number };
  };
}

export interface ReadinessData {
  sleepHours: number | null;
  hrv: number | null; // ms
  restingHr: number | null; // bpm
  hrvSevenDayAvg: number | null;
  restingHrSevenDayAvg: number | null;
}

export type HRZone = 'z1' | 'z2' | 'z3' | 'z4' | 'z5';

export interface HRZoneInfo {
  zone: HRZone;
  label: string;
  color: string;
  minPct: number;
  maxPct: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Build an ISO-8601 date string (YYYY-MM-DD) for a given Date */
function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Start of a given YYYY-MM-DD date */
function startOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** End of a given YYYY-MM-DD date */
function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** N days ago at start-of-day */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Average an array of numbers, returns 0 for empty arrays */
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ---------------------------------------------------------------------------
// iOS-specific helpers
// ---------------------------------------------------------------------------

function iosInitialized(): boolean {
  return Platform.OS === 'ios' && AppleHealthKit !== null;
}

function iosPermissions(): any {
  return {
    permissions: {
      read: [
        'Steps',
        'HeartRate',
        'SleepAnalysis',
        'HeartRateVariabilitySDNN',
        'RestingHeartRate',
        'Workout',
        'ActiveEnergyBurned',
      ],
      write: ['Steps', 'Workout', 'ActiveEnergyBurned'],
    },
  };
}

/** Promisify AppleHealthKit.initHealthKit */
function iosInit(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      AppleHealthKit.initHealthKit(iosPermissions(), (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/** Generic promisifier for AppleHealthKit callback-style API */
function iosCall<T>(
  fn: (opts: any, cb: (err: any, results: T) => void) => void,
  opts: any,
): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      fn(opts, (err: any, results: T) => {
        if (err) reject(err);
        else resolve(results);
      });
    } catch (e) {
      reject(e);
    }
  });
}

// ---------------------------------------------------------------------------
// Android-specific helpers
// ---------------------------------------------------------------------------

function androidAvailable(): boolean {
  return Platform.OS === 'android' && HealthConnect !== null;
}

const ANDROID_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'HeartRateVariability' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'write', recordType: 'ExerciseSession' },
  { accessType: 'write', recordType: 'ActiveCaloriesBurned' },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if a health platform is available on this device.
 * On iOS this checks that the react-native-health module loaded.
 * On Android this checks that react-native-health-connect loaded.
 */
export function isHealthPlatformAvailable(): boolean {
  try {
    if (Platform.OS === 'ios') return AppleHealthKit !== null;
    if (Platform.OS === 'android') return HealthConnect !== null;
    return false;
  } catch {
    return false;
  }
}

/**
 * Request all required health permissions.
 * Returns true if permissions were granted (or already available).
 */
export async function requestHealthPermissions(): Promise<boolean> {
  try {
    if (iosInitialized()) {
      await iosInit();
      return true;
    }

    if (androidAvailable()) {
      const initialized = await HealthConnect!.initialize();
      if (!initialized) return false;
      await HealthConnect!.requestPermission(ANDROID_PERMISSIONS);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Read today's step count.
 * @param date - YYYY-MM-DD string
 */
export async function readStepCount(date: string): Promise<number> {
  try {
    if (iosInitialized()) {
      const opts = {
        date: endOfDay(date).toISOString(),
        includeManuallyAdded: false,
      };
      const result = await iosCall<any>(
        AppleHealthKit.getStepCount.bind(AppleHealthKit),
        opts,
      );
      return result?.value ?? 0;
    }

    if (androidAvailable()) {
      const result = await HealthConnect!.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay(date).toISOString(),
          endTime: endOfDay(date).toISOString(),
        },
      });
      const records: any[] = result?.records ?? result ?? [];
      return records.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);
    }

    return 0;
  } catch {
    return 0;
  }
}

/**
 * Read heart rate samples between two dates.
 */
export async function readHeartRate(
  startDate: Date,
  endDate: Date,
): Promise<HeartRateSample[]> {
  try {
    if (iosInitialized()) {
      const opts = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
        limit: 500,
      };
      const results = await iosCall<any[]>(
        AppleHealthKit.getHeartRateSamples.bind(AppleHealthKit),
        opts,
      );
      return (results ?? []).map((r: any) => ({
        bpm: r.value,
        timestamp: new Date(r.startDate ?? r.endDate),
      }));
    }

    if (androidAvailable()) {
      const result = await HealthConnect!.readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const records: any[] = result?.records ?? result ?? [];
      const samples: HeartRateSample[] = [];
      for (const r of records) {
        const rSamples: any[] = r.samples ?? [];
        for (const s of rSamples) {
          samples.push({
            bpm: s.beatsPerMinute,
            timestamp: new Date(s.time ?? r.startTime),
          });
        }
      }
      return samples;
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Read the most recent heart rate sample.
 * Returns null if unavailable.
 */
export async function readLatestHeartRate(): Promise<number | null> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const samples = await readHeartRate(oneHourAgo, now);
    if (samples.length === 0) return null;
    // Sort descending by timestamp and return the most recent
    samples.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return samples[0].bpm;
  } catch {
    return null;
  }
}

/**
 * Read sleep data for a given date (YYYY-MM-DD).
 * Returns zeroed SleepData on failure.
 */
export async function readSleepData(date: string): Promise<SleepData> {
  const fallback: SleepData = { totalHours: 0, deepHours: 0, remHours: 0, date };

  try {
    if (iosInitialized()) {
      // HealthKit sleep: look back from noon on given date to noon the day before
      const endDt = new Date(date);
      endDt.setHours(12, 0, 0, 0);
      const startDt = new Date(endDt.getTime() - 24 * 60 * 60 * 1000);

      const opts = {
        startDate: startDt.toISOString(),
        endDate: endDt.toISOString(),
      };

      const results = await iosCall<any[]>(
        AppleHealthKit.getSleepSamples.bind(AppleHealthKit),
        opts,
      );

      const samples: any[] = results ?? [];
      let totalMs = 0;
      let deepMs = 0;
      let remMs = 0;

      for (const s of samples) {
        const start = new Date(s.startDate).getTime();
        const end = new Date(s.endDate).getTime();
        const durationMs = end - start;
        if (durationMs <= 0) continue;

        const value: string = s.value ?? '';
        // HKCategoryValueSleepAnalysis values
        // Only count INBED/ASLEEP toward totalMs — DEEP and REM are sub-stages
        // already included in the ASLEEP record, so adding them to totalMs would
        // double-count them.
        if (value === 'INBED' || value === 'ASLEEP') {
          totalMs += durationMs;
        }
        if (value === 'DEEP') {
          deepMs += durationMs;
        }
        if (value === 'REM') {
          remMs += durationMs;
        }
      }

      return {
        totalHours: Math.round((totalMs / 3_600_000) * 10) / 10,
        deepHours: Math.round((deepMs / 3_600_000) * 10) / 10,
        remHours: Math.round((remMs / 3_600_000) * 10) / 10,
        date,
      };
    }

    if (androidAvailable()) {
      const endDt = new Date(date);
      endDt.setHours(12, 0, 0, 0);
      const startDt = new Date(endDt.getTime() - 24 * 60 * 60 * 1000);

      const result = await HealthConnect!.readRecords('SleepSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDt.toISOString(),
          endTime: endDt.toISOString(),
        },
      });

      const records: any[] = result?.records ?? result ?? [];
      let totalMs = 0;
      let deepMs = 0;
      let remMs = 0;

      for (const r of records) {
        const start = new Date(r.startTime).getTime();
        const end = new Date(r.endTime).getTime();
        totalMs += end - start;

        const stages: any[] = r.stages ?? [];
        for (const stage of stages) {
          const sMs =
            new Date(stage.endTime).getTime() -
            new Date(stage.startTime).getTime();
          // stage.stage: 4 = DEEP, 5 = REM (Health Connect constants)
          if (stage.stage === 4) deepMs += sMs;
          if (stage.stage === 5) remMs += sMs;
        }
      }

      return {
        totalHours: Math.round((totalMs / 3_600_000) * 10) / 10,
        deepHours: Math.round((deepMs / 3_600_000) * 10) / 10,
        remHours: Math.round((remMs / 3_600_000) * 10) / 10,
        date,
      };
    }

    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Read HRV data for the last N days.
 */
export async function readHRV(days: number): Promise<HRVData> {
  const fallback: HRVData = { average: 0, samples: [], sevenDayAvg: 0 };

  try {
    const endDt = new Date();
    const startDt = daysAgo(days);

    if (iosInitialized()) {
      const opts = {
        startDate: startDt.toISOString(),
        endDate: endDt.toISOString(),
        ascending: true,
        limit: days * 10,
      };

      const results = await iosCall<any[]>(
        AppleHealthKit.getHeartRateVariabilitySamples.bind(AppleHealthKit),
        opts,
      );

      const samples = (results ?? []).map((r: any) => ({
        value: r.value,
        date: toDateString(new Date(r.startDate ?? r.endDate)),
      }));

      const values = samples.map((s) => s.value);
      const average = avg(values);

      // 7-day sub-window
      const sevenDayCutoff = daysAgo(7);
      const sevenDayValues = (results ?? [])
        .filter((r: any) => new Date(r.startDate ?? r.endDate) >= sevenDayCutoff)
        .map((r: any) => r.value);
      const sevenDayAvg = avg(sevenDayValues);

      return { average, samples, sevenDayAvg };
    }

    if (androidAvailable()) {
      const result = await HealthConnect!.readRecords('HeartRateVariability', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDt.toISOString(),
          endTime: endDt.toISOString(),
        },
      });

      const records: any[] = result?.records ?? result ?? [];
      const samples = records.map((r: any) => ({
        value: r.heartRateVariabilityMillis ?? r.rmssd ?? 0,
        date: toDateString(new Date(r.time ?? r.startTime)),
      }));

      const values = samples.map((s) => s.value);
      const average = avg(values);

      const sevenDayCutoff = daysAgo(7);
      const sevenDayValues = records
        .filter(
          (r: any) => new Date(r.time ?? r.startTime) >= sevenDayCutoff,
        )
        .map((r: any) => r.heartRateVariabilityMillis ?? r.rmssd ?? 0);
      const sevenDayAvg = avg(sevenDayValues);

      return { average, samples, sevenDayAvg };
    }

    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Read resting heart rate for the last N days.
 */
export async function readRestingHeartRate(days: number): Promise<RestingHRData> {
  const fallback: RestingHRData = { value: 0, sevenDayAvg: 0 };

  try {
    const endDt = new Date();
    const startDt = daysAgo(days);

    if (iosInitialized()) {
      const opts = {
        startDate: startDt.toISOString(),
        endDate: endDt.toISOString(),
        ascending: false,
        limit: days,
      };

      const results = await iosCall<any[]>(
        AppleHealthKit.getRestingHeartRateSamples.bind(AppleHealthKit),
        opts,
      );

      const records: any[] = results ?? [];
      const latest = records[0]?.value ?? 0;

      const sevenDayCutoff = daysAgo(7);
      const sevenDayValues = records
        .filter(
          (r: any) => new Date(r.startDate ?? r.endDate) >= sevenDayCutoff,
        )
        .map((r: any) => r.value);
      const sevenDayAvg = avg(sevenDayValues);

      return { value: latest, sevenDayAvg };
    }

    if (androidAvailable()) {
      const result = await HealthConnect!.readRecords('RestingHeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDt.toISOString(),
          endTime: endDt.toISOString(),
        },
      });

      const records: any[] = result?.records ?? result ?? [];
      // Sort descending by time
      records.sort(
        (a: any, b: any) =>
          new Date(b.time ?? b.startTime).getTime() -
          new Date(a.time ?? a.startTime).getTime(),
      );

      const latest = records[0]?.beatsPerMinute ?? 0;

      const sevenDayCutoff = daysAgo(7);
      const sevenDayValues = records
        .filter(
          (r: any) => new Date(r.time ?? r.startTime) >= sevenDayCutoff,
        )
        .map((r: any) => r.beatsPerMinute ?? 0);
      const sevenDayAvg = avg(sevenDayValues);

      return { value: latest, sevenDayAvg };
    }

    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a completed workout to the health platform.
 */
export async function writeWorkout(data: WorkoutData): Promise<void> {
  try {
    if (iosInitialized()) {
      const activityType =
        HKWorkoutActivityType?.traditionalStrengthTraining ?? 50;

      const opts: any = {
        type: activityType,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      };

      if (data.calories !== undefined) {
        opts.energyBurned = data.calories;
        opts.energyBurnedUnit = 'calorie';
      }

      await new Promise<void>((resolve, reject) => {
        try {
          AppleHealthKit.saveWorkout(opts, (err: any) => {
            if (err) reject(err);
            else resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
      return;
    }

    if (androidAvailable()) {
      const records: any[] = [
        {
          recordType: 'ExerciseSession',
          startTime: data.startDate.toISOString(),
          endTime: data.endDate.toISOString(),
          exerciseType: 'EXERCISE_TYPE_STRENGTH_TRAINING',
        },
      ];

      if (data.calories !== undefined) {
        records.push({
          recordType: 'ActiveCaloriesBurned',
          startTime: data.startDate.toISOString(),
          endTime: data.endDate.toISOString(),
          energy: {
            value: data.calories,
            unit: 'calories',
          },
        });
      }

      await HealthConnect!.insertRecords(records);
    }
  } catch {
    // Silently swallow — never throw
  }
}

/**
 * Subscribe to heart rate updates via polling every 5 seconds.
 * Calls callback with the latest BPM when a new reading is available.
 * Returns an unsubscribe function.
 */
export function subscribeHeartRate(callback: (bpm: number) => void): () => void {
  const intervalId = setInterval(async () => {
    try {
      const bpm = await readLatestHeartRate();
      if (bpm !== null) {
        callback(bpm);
      }
    } catch {
      // Ignore errors in polling loop
    }
  }, 5000);

  return () => clearInterval(intervalId);
}

/**
 * Get readiness data: sleep + HRV + resting HR.
 */
export async function getReadinessData(): Promise<ReadinessData> {
  const fallback: ReadinessData = {
    sleepHours: null,
    hrv: null,
    restingHr: null,
    hrvSevenDayAvg: null,
    restingHrSevenDayAvg: null,
  };

  try {
    const today = toDateString(new Date());

    const [sleepData, hrvData, restingData] = await Promise.all([
      readSleepData(today),
      readHRV(7),
      readRestingHeartRate(7),
    ]);

    return {
      sleepHours: sleepData.totalHours > 0 ? sleepData.totalHours : null,
      hrv: hrvData.average > 0 ? hrvData.average : null,
      restingHr: restingData.value > 0 ? restingData.value : null,
      hrvSevenDayAvg: hrvData.sevenDayAvg > 0 ? hrvData.sevenDayAvg : null,
      restingHrSevenDayAvg:
        restingData.sevenDayAvg > 0 ? restingData.sevenDayAvg : null,
    };
  } catch {
    return fallback;
  }
}

/**
 * Get HR zone breakdown for a completed workout.
 */
export async function getWorkoutHRData(
  startTime: Date,
  endTime: Date,
): Promise<WorkoutHRData> {
  const fallbackZones = {
    z1: { minutes: 0, percentage: 0 },
    z2: { minutes: 0, percentage: 0 },
    z3: { minutes: 0, percentage: 0 },
    z4: { minutes: 0, percentage: 0 },
    z5: { minutes: 0, percentage: 0 },
  };
  const fallback: WorkoutHRData = {
    averageHR: null,
    peakHR: null,
    zones: fallbackZones,
  };

  try {
    const samples = await readHeartRate(startTime, endTime);
    if (samples.length === 0) return fallback;

    const bpms = samples.map((s) => s.bpm);
    const averageHR = Math.round(avg(bpms));
    const peakHR = Math.max(...bpms);

    // We don't know the user's age here so we use a default of 30
    // (caller can use getHRZone directly with actual age for precise zoning)
    const DEFAULT_AGE = 30;

    const zoneCounts = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
    for (const bpm of bpms) {
      const zone = getHRZone(bpm, DEFAULT_AGE);
      zoneCounts[zone]++;
    }

    const total = bpms.length;
    const durationMinutes =
      (endTime.getTime() - startTime.getTime()) / 60_000;

    const toZoneResult = (count: number) => ({
      minutes: Math.round((count / total) * durationMinutes * 10) / 10,
      percentage: Math.round((count / total) * 100),
    });

    return {
      averageHR,
      peakHR,
      zones: {
        z1: toZoneResult(zoneCounts.z1),
        z2: toZoneResult(zoneCounts.z2),
        z3: toZoneResult(zoneCounts.z3),
        z4: toZoneResult(zoneCounts.z4),
        z5: toZoneResult(zoneCounts.z5),
      },
    };
  } catch {
    return fallback;
  }
}

/**
 * Determine the HR zone for a given BPM and age.
 * maxHR = 220 - age
 * Z1: <50%, Z2: 50-60%, Z3: 60-70%, Z4: 70-85%, Z5: >85%
 */
export function getHRZone(bpm: number, age: number): HRZone {
  try {
    const maxHR = 220 - age;
    const pct = bpm / maxHR;
    if (pct >= 0.85) return 'z5';
    if (pct >= 0.70) return 'z4';
    if (pct >= 0.60) return 'z3';
    if (pct >= 0.50) return 'z2';
    return 'z1';
  } catch {
    return 'z1';
  }
}

/**
 * Get display info for an HR zone (label, color, percentage range).
 */
export function getHRZoneInfo(zone: HRZone): HRZoneInfo {
  try {
    const zoneMap: Record<HRZone, HRZoneInfo> = {
      z1: {
        zone: 'z1',
        label: 'Recovery',
        color: '#6b7280',
        minPct: 0,
        maxPct: 50,
      },
      z2: {
        zone: 'z2',
        label: 'Fat Burn',
        color: '#3b82f6',
        minPct: 50,
        maxPct: 60,
      },
      z3: {
        zone: 'z3',
        label: 'Cardio',
        color: '#22c55e',
        minPct: 60,
        maxPct: 70,
      },
      z4: {
        zone: 'z4',
        label: 'Hard',
        color: '#f97316',
        minPct: 70,
        maxPct: 85,
      },
      z5: {
        zone: 'z5',
        label: 'Peak',
        color: '#ef4444',
        minPct: 85,
        maxPct: 100,
      },
    };
    return zoneMap[zone] ?? zoneMap['z1'];
  } catch {
    return { zone: 'z1', label: 'Recovery', color: '#6b7280', minPct: 0, maxPct: 50 };
  }
}
