import { type WorkoutHRData } from './health-platform';

const MAX_EXPECTED_DENSITY = 200; // kg/min — normalizing constant for heavy compound sessions

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface IntensityInput {
  totalVolumeKg: number;
  durationSeconds: number;
  setCount: number;
  avgRpe?: number | null;
  hrData?: WorkoutHRData | null;
  userAge?: number | null;
}

export interface IntensityResult {
  score: number;          // 0-100
  label: 'Light' | 'Moderate' | 'Intense';
  color: string;          // hex color for UI
}

/**
 * Calculate a 0-100 workout intensity score.
 * Uses HR data when available (Pro + watch), falls back to volume/RPE metrics.
 */
export function calculateIntensityScore(input: IntensityInput): IntensityResult {
  const { totalVolumeKg, durationSeconds, setCount, avgRpe, hrData, userAge } = input;
  const durationMin = durationSeconds / 60;

  if (durationMin <= 0) return { score: 0, label: 'Light', color: '#22c55e' };

  const volumeDensity = totalVolumeKg / durationMin;
  let score: number;

  if (hrData && userAge && hrData.averageHR != null && hrData.averageHR > 0) {
    // WITH HR data — volume (40) + HR effort (30) + zone time (30)
    const volumeScore = clamp((volumeDensity / MAX_EXPECTED_DENSITY) * 40, 0, 40);

    const maxHR = 220 - userAge;
    const avgHrPct = hrData.averageHR! / maxHR;
    const hrScore = clamp(avgHrPct * 100 - 30, 0, 30);

    const z4z5Minutes = (hrData.zones.z4?.minutes ?? 0) + (hrData.zones.z5?.minutes ?? 0);
    const totalMinutes = durationMin;
    const z4z5Pct = totalMinutes > 0 ? z4z5Minutes / totalMinutes : 0;
    const zoneScore = clamp(z4z5Pct * 100, 0, 30);

    score = Math.round(volumeScore + hrScore + zoneScore);
  } else {
    // WITHOUT HR data — volume (50) + sets (25) + RPE (25)
    const volumeScore = clamp((volumeDensity / MAX_EXPECTED_DENSITY) * 50, 0, 50);
    const setScore = clamp((setCount / 30) * 25, 0, 25);
    const rpeScore = avgRpe ? clamp((avgRpe / 10) * 25, 0, 25) : 12;

    score = Math.round(volumeScore + setScore + rpeScore);
  }

  score = clamp(score, 0, 100);

  let label: IntensityResult['label'];
  let color: string;
  if (score < 40) {
    label = 'Light';
    color = '#22c55e';
  } else if (score < 70) {
    label = 'Moderate';
    color = '#f59e0b';
  } else {
    label = 'Intense';
    color = '#ef4444';
  }

  return { score, label, color };
}
