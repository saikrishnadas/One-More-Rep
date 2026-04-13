export interface WarmupSet {
  weightKg: number;
  reps: number;
  isWarmup: true;
}

/**
 * Generate warm-up sets for a given working weight.
 * Standard protocol: 40%, 60%, 80% of target weight.
 * Rounds to nearest 2.5kg (minimum barbellKg).
 *
 * @param targetWeightKg - The working weight (first real set)
 * @param barbellKg - Barbell weight (default 20kg, used as minimum)
 */
export function getWarmupSets(targetWeightKg: number, barbellKg: number = 20): WarmupSet[] {
  if (targetWeightKg <= 0) return [];

  const pcts = [0.4, 0.6, 0.8];
  const reps = [5, 3, 2];

  return pcts.map((pct, i) => {
    const raw = targetWeightKg * pct;
    // Round to nearest 2.5kg
    const rounded = Math.max(barbellKg, Math.round(raw / 2.5) * 2.5);
    return { weightKg: rounded, reps: reps[i], isWarmup: true as const };
  });
}
