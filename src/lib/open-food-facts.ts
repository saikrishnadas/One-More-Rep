export interface FoodSearchResult {
  name: string;
  brand: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingSize: string;
}

interface OFFProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: {
    'energy-kcal_serving'?: number;
    'energy-kcal_100g'?: number;
    proteins_serving?: number;
    proteins_100g?: number;
    carbohydrates_serving?: number;
    carbohydrates_100g?: number;
    fat_serving?: number;
    fat_100g?: number;
    fiber_serving?: number;
    fiber_100g?: number;
  };
}

function extractNutrient(
  product: OFFProduct,
  servingKey: keyof NonNullable<OFFProduct['nutriments']>,
  per100Key: keyof NonNullable<OFFProduct['nutriments']>,
): number {
  const n = product.nutriments;
  if (!n) return 0;
  const val = n[servingKey] ?? (n[per100Key] ? (n[per100Key] as number) * 0.01 * 100 : 0);
  return Math.round((val as number) * 10) / 10;
}

export async function searchFood(query: string): Promise<FoodSearchResult[]> {
  if (!query.trim()) return [];
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,serving_size,nutriments`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const products: OFFProduct[] = data.products ?? [];
  return products
    .filter((p) => p.product_name && p.nutriments?.['energy-kcal_serving'])
    .map((p) => ({
      name: p.product_name!,
      brand: p.brands ?? '',
      calories: Math.round(extractNutrient(p, 'energy-kcal_serving', 'energy-kcal_100g')),
      proteinG: extractNutrient(p, 'proteins_serving', 'proteins_100g'),
      carbsG: extractNutrient(p, 'carbohydrates_serving', 'carbohydrates_100g'),
      fatG: extractNutrient(p, 'fat_serving', 'fat_100g'),
      fiberG: extractNutrient(p, 'fiber_serving', 'fiber_100g'),
      servingSize: p.serving_size ?? '',
    }));
}

export async function lookupBarcode(barcode: string): Promise<FoodSearchResult | null> {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1) return null;
  const p: OFFProduct = data.product;
  if (!p.product_name) return null;
  return {
    name: p.product_name,
    brand: p.brands ?? '',
    calories: Math.round(extractNutrient(p, 'energy-kcal_serving', 'energy-kcal_100g')),
    proteinG: extractNutrient(p, 'proteins_serving', 'proteins_100g'),
    carbsG: extractNutrient(p, 'carbohydrates_serving', 'carbohydrates_100g'),
    fatG: extractNutrient(p, 'fat_serving', 'fat_100g'),
    fiberG: extractNutrient(p, 'fiber_serving', 'fiber_100g'),
    servingSize: p.serving_size ?? '',
  };
}
