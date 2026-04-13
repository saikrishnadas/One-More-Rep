export function estimateWorkoutCalories(
  durationSeconds: number,
  totalVolumeKg: number,
  userWeightKg: number
): number {
  const durationMin = durationSeconds / 60;
  const durationHours = durationSeconds / 3600;

  if (durationMin <= 0) return 0;

  const intensityPerMin = totalVolumeKg / durationMin;

  let met: number;
  if (intensityPerMin < 50) {
    met = 3.5;
  } else if (intensityPerMin < 150) {
    met = 5.0;
  } else {
    met = 6.5;
  }

  return Math.round(met * userWeightKg * durationHours);
}

/**
 * Estimates sweat fluid loss in millilitres.
 * Rough model: ~500ml/hr at low intensity, ~800ml/hr at moderate, ~1200ml/hr at high.
 * Recommend drinking 1.5× lost fluid to fully rehydrate.
 */
export function estimateSweatLossMl(
  durationSeconds: number,
  totalVolumeKg: number
): { lostMl: number; drinkMl: number } {
  const durationMin = durationSeconds / 60;
  if (durationMin <= 0) return { lostMl: 0, drinkMl: 0 };

  const intensityPerMin = totalVolumeKg / durationMin;
  let mlPerHour: number;
  if (intensityPerMin < 50) {
    mlPerHour = 500;
  } else if (intensityPerMin < 150) {
    mlPerHour = 800;
  } else {
    mlPerHour = 1200;
  }

  const lostMl = Math.round((mlPerHour * durationMin) / 60);
  const drinkMl = Math.round(lostMl * 1.5);
  return { lostMl, drinkMl };
}
