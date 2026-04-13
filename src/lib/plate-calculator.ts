export interface PlateResult {
  perSide: number[];
  remainder: number;
  isExact: boolean;
  totalWithBar: number;
}

const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]; // kg

export function calculatePlates(
  targetKg: number,
  barbellKg: number = 20,
  availablePlates: number[] = DEFAULT_PLATES
): PlateResult {
  if (targetKg <= barbellKg) {
    return { perSide: [], remainder: 0, isExact: true, totalWithBar: barbellKg };
  }

  const sorted = [...availablePlates].sort((a, b) => b - a);
  let remaining = (targetKg - barbellKg) / 2;
  const perSide: number[] = [];

  for (const plate of sorted) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / plate);
    for (let i = 0; i < count; i++) {
      perSide.push(plate);
    }
    remaining = Math.round((remaining - count * plate) * 10000) / 10000;
  }

  const loadedPerSide = perSide.reduce((sum, p) => sum + p, 0);
  const totalWithBar = Math.round((barbellKg + loadedPerSide * 2) * 10000) / 10000;
  const remainder = Math.round(remaining * 2 * 10000) / 10000;
  const isExact = remainder === 0;

  return { perSide, remainder, isExact, totalWithBar };
}
