import { readHRV, isHealthPlatformAvailable } from './health-platform';

export interface HRVTrendPoint {
  date: string;       // 'MM/DD'
  value: number;      // HRV in ms
  movingAvg: number;  // 7-day moving average
}

export interface HRVTrendResult {
  hasEnoughData: boolean;    // need at least 7 data points
  points: HRVTrendPoint[];
  currentHRV: number;
  sevenDayAvg: number;
  percentOfBaseline: number;  // current / avg * 100
  recommendation: {
    label: string;          // "Push Hard" | "Normal Session" | "Light Day" | "Rest Day"
    detail: string;         // actionable text
    color: string;          // hex
  };
}

export async function analyzeHRVTrend(): Promise<HRVTrendResult> {
  const empty: HRVTrendResult = {
    hasEnoughData: false,
    points: [],
    currentHRV: 0,
    sevenDayAvg: 0,
    percentOfBaseline: 0,
    recommendation: { label: '', detail: '', color: '#9ca3af' },
  };

  if (!isHealthPlatformAvailable()) return empty;

  try {
    const hrvData = await readHRV(30);

    if (!hrvData.samples || hrvData.samples.length < 7) return empty;

    // Sort samples by date
    const sorted = [...hrvData.samples].sort((a, b) => a.date.localeCompare(b.date));

    // Compute 7-day moving average for each point
    const points: HRVTrendPoint[] = sorted.map((sample, i) => {
      const window = sorted.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((sum, s) => sum + s.value, 0) / window.length;
      return {
        date: sample.date.slice(5).replace('-', '/'), // 'YYYY-MM-DD' → 'MM/DD'
        value: Math.round(sample.value),
        movingAvg: Math.round(avg),
      };
    });

    const currentHRV = sorted[sorted.length - 1].value;
    const sevenDayAvg = hrvData.sevenDayAvg ||
      sorted.slice(-7).reduce((s, p) => s + p.value, 0) / Math.min(7, sorted.length);

    const percentOfBaseline = sevenDayAvg > 0
      ? Math.round((currentHRV / sevenDayAvg) * 100)
      : 100;

    // Generate recommendation
    let recommendation: HRVTrendResult['recommendation'];
    if (percentOfBaseline >= 110) {
      recommendation = {
        label: 'Push Hard',
        detail: 'HRV is above baseline — great recovery. Increase intensity or volume today.',
        color: '#22c55e',
      };
    } else if (percentOfBaseline >= 90) {
      recommendation = {
        label: 'Normal Session',
        detail: 'HRV is at baseline — normal training is appropriate.',
        color: '#3b82f6',
      };
    } else if (percentOfBaseline >= 75) {
      recommendation = {
        label: 'Light Day',
        detail: 'HRV is below baseline — reduce volume by ~20%. Focus on technique.',
        color: '#f59e0b',
      };
    } else {
      recommendation = {
        label: 'Rest Day',
        detail: 'HRV is significantly depleted — consider active recovery or rest.',
        color: '#ef4444',
      };
    }

    return {
      hasEnoughData: true,
      points,
      currentHRV: Math.round(currentHRV),
      sevenDayAvg: Math.round(sevenDayAvg),
      percentOfBaseline,
      recommendation,
    };
  } catch {
    return empty;
  }
}
