# Phase 3: Nutrition Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full nutrition tracking experience — daily calorie/macro view with a donut ring, meal sections, food search via Open Food Facts API, manual food entry, barcode scanner, nutrition goals setup, Supabase sync, and a weekly report screen.

**Architecture:** Offline-first: nutrition logs written to local SQLite (Drizzle ORM), synced to Supabase after each log. Goals stored in SQLite and Supabase. Food search queries Open Food Facts API directly from the client. Barcode scanner uses expo-camera.

**Tech Stack:** React Native, Expo Router, Zustand, Drizzle ORM, expo-sqlite, Supabase, react-native-svg, expo-camera, expo-crypto

---

## File Map

```
app/
  (tabs)/nutrition.tsx          # Main nutrition screen: daily ring + meal sections
  nutrition-goals.tsx           # Goals setup modal
  nutrition-report.tsx          # Weekly report screen

src/
  stores/
    nutrition.ts                # Zustand: today's logs, goals, add/remove helpers
  lib/
    open-food-facts.ts          # searchFood(query): Open Food Facts API helper
    nutrition-sync.ts           # syncNutritionLogs(date): push logs to Supabase
  components/
    nutrition/
      CalorieRing.tsx           # SVG donut chart (consumed / goal)
      MacroBar.tsx              # Single macro progress bar row
      MealSection.tsx           # Collapsible meal section (breakfast etc.)
      AddFoodModal.tsx          # Full-screen modal: search + manual + barcode tabs
```

---

## Task 1: Nutrition Zustand store

**Files:**
- Create: `src/stores/nutrition.ts`

- [ ] **Step 1.1: Create nutrition store**

Create `src/stores/nutrition.ts`:

```typescript
import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import { db } from '@/db/client';
import { nutritionLogs, nutritionGoals } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';

export interface NutritionEntry {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  source: string;
}

export interface NutritionGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface NutritionState {
  entries: NutritionEntry[];
  goals: NutritionGoals;
  selectedDate: string;
  isLoading: boolean;

  loadDay: (userId: string, date?: string) => Promise<void>;
  loadGoals: (userId: string) => Promise<void>;
  addEntry: (userId: string, entry: Omit<NutritionEntry, 'id' | 'userId' | 'date'>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  saveGoals: (userId: string, goals: NutritionGoals) => Promise<void>;
  setSelectedDate: (date: string) => void;
}

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2200,
  proteinG: 180,
  carbsG: 250,
  fatG: 70,
};

export const useNutritionStore = create<NutritionState>((set, get) => ({
  entries: [],
  goals: DEFAULT_GOALS,
  selectedDate: formatDate(new Date()),
  isLoading: false,

  loadDay: async (userId, date) => {
    const targetDate = date ?? get().selectedDate;
    set({ isLoading: true });
    const rows = await db
      .select()
      .from(nutritionLogs)
      .where(and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, targetDate)));
    set({
      entries: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        date: r.date,
        mealType: r.mealType as NutritionEntry['mealType'],
        foodName: r.foodName,
        calories: r.calories ?? 0,
        proteinG: r.proteinG ?? 0,
        carbsG: r.carbsG ?? 0,
        fatG: r.fatG ?? 0,
        fiberG: r.fiberG ?? 0,
        source: r.source ?? 'manual',
      })),
      isLoading: false,
    });
  },

  loadGoals: async (userId) => {
    const [row] = await db
      .select()
      .from(nutritionGoals)
      .where(eq(nutritionGoals.userId, userId));
    if (row) {
      set({
        goals: {
          calories: row.calories ?? DEFAULT_GOALS.calories,
          proteinG: row.proteinG ?? DEFAULT_GOALS.proteinG,
          carbsG: row.carbsG ?? DEFAULT_GOALS.carbsG,
          fatG: row.fatG ?? DEFAULT_GOALS.fatG,
        },
      });
    }
  },

  addEntry: async (userId, entry) => {
    const id = randomUUID();
    const date = get().selectedDate;
    await db.insert(nutritionLogs).values({
      id,
      userId,
      date,
      mealType: entry.mealType,
      foodName: entry.foodName,
      calories: entry.calories,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
      fiberG: entry.fiberG,
      source: entry.source,
    });
    set({
      entries: [
        ...get().entries,
        { id, userId, date, ...entry },
      ],
    });
  },

  removeEntry: async (id) => {
    await db.delete(nutritionLogs).where(eq(nutritionLogs.id, id));
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },

  saveGoals: async (userId, goals) => {
    // Upsert: delete then insert (SQLite doesn't support ON CONFLICT easily with Drizzle)
    await db.delete(nutritionGoals).where(eq(nutritionGoals.userId, userId));
    await db.insert(nutritionGoals).values({
      id: randomUUID(),
      userId,
      calories: goals.calories,
      proteinG: goals.proteinG,
      carbsG: goals.carbsG,
      fatG: goals.fatG,
    });
    set({ goals });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
}));
```

- [ ] **Step 1.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add src/stores/nutrition.ts && git commit -m "feat: add nutrition Zustand store (daily logs, goals, CRUD)"
```

---

## Task 2: Open Food Facts API helper

**Files:**
- Create: `src/lib/open-food-facts.ts`

- [ ] **Step 2.1: Create API helper**

Create `src/lib/open-food-facts.ts`:

```typescript
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
```

- [ ] **Step 2.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add src/lib/open-food-facts.ts && git commit -m "feat: add Open Food Facts API helper (search + barcode lookup)"
```

---

## Task 3: CalorieRing component

**Files:**
- Create: `src/components/nutrition/CalorieRing.tsx`

- [ ] **Step 3.1: Create CalorieRing**

Create `src/components/nutrition/CalorieRing.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { Colors, FontSize, FontWeight } from '@/lib/constants';

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

export function CalorieRing({ consumed, goal, size = 160 }: CalorieRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.bgCardBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? Colors.secondary : Colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.inner}>
        <Text style={styles.consumed}>{Math.round(consumed)}</Text>
        <Text style={styles.label}>kcal</Text>
        <Text style={[styles.remaining, isOver && { color: Colors.secondary }]}>
          {isOver ? `+${Math.round(consumed - goal)} over` : `${Math.round(remaining)} left`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  inner: { alignItems: 'center' },
  consumed: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  remaining: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
});
```

- [ ] **Step 3.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add src/components/nutrition/CalorieRing.tsx && git commit -m "feat: add CalorieRing SVG donut chart component"
```

---

## Task 4: MacroBar component

**Files:**
- Create: `src/components/nutrition/MacroBar.tsx`

- [ ] **Step 4.1: Create MacroBar**

Create `src/components/nutrition/MacroBar.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';

interface MacroBarProps {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, consumed, goal, color, unit = 'g' }: MacroBarProps) {
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const isOver = consumed > goal;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color }]}>{label}</Text>
        <Text style={styles.values}>
          <Text style={[styles.consumed, { color }]}>{Math.round(consumed)}</Text>
          <Text style={styles.goal}> / {goal}{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isOver ? Colors.secondary : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  values: {},
  consumed: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  goal: { fontSize: FontSize.sm, color: Colors.textMuted },
  track: {
    height: 6,
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
```

- [ ] **Step 4.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add src/components/nutrition/MacroBar.tsx && git commit -m "feat: add MacroBar progress bar component"
```

---

## Task 5: MealSection component

**Files:**
- Create: `src/components/nutrition/MealSection.tsx`

- [ ] **Step 5.1: Create MealSection**

Create `src/components/nutrition/MealSection.tsx`:

```typescript
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import type { NutritionEntry } from '@/stores/nutrition';

interface MealSectionProps {
  title: string;
  icon: string;
  entries: NutritionEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function MealSection({ title, icon, entries, onAdd, onRemove }: MealSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const totalCals = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{icon}</Text>
          <Text variant="title">{title}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text variant="caption">{Math.round(totalCals)} kcal</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Food items */}
      {expanded && (
        <View style={styles.items}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryInfo}>
                <Text variant="body">{entry.foodName}</Text>
                <Text variant="caption">
                  {Math.round(entry.calories)} kcal · P:{Math.round(entry.proteinG)}g · C:{Math.round(entry.carbsG)}g · F:{Math.round(entry.fatG)}g
                </Text>
              </View>
              <TouchableOpacity onPress={() => onRemove(entry.id)} hitSlop={8} style={styles.removeBtn}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add food button */}
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addText}>+ Add Food</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icon: { fontSize: 18 },
  chevron: { fontSize: FontSize.xs, color: Colors.textMuted },
  items: { borderTopWidth: 1, borderTopColor: Colors.bgCardBorder },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCardBorder,
  },
  entryInfo: { flex: 1 },
  removeBtn: { padding: 4 },
  removeIcon: { fontSize: FontSize.sm, color: Colors.textMuted },
  addBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  addText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
});
```

- [ ] **Step 5.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add src/components/nutrition/MealSection.tsx && git commit -m "feat: add MealSection collapsible component with add/remove food"
```

---

## Task 6: AddFoodModal

**Files:**
- Create: `src/components/nutrition/AddFoodModal.tsx`

- [ ] **Step 6.1: Create AddFoodModal**

Create `src/components/nutrition/AddFoodModal.tsx`. This modal has three tabs: Search, Manual, and Barcode. The barcode tab uses expo-camera's CameraView to scan EAN/UPC codes.

```typescript
import React, { useState, useRef } from 'react';
import {
  View, Modal, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { searchFood, lookupBarcode, FoodSearchResult } from '@/lib/open-food-facts';
import type { NutritionEntry } from '@/stores/nutrition';

type Tab = 'search' | 'manual' | 'barcode';
type MealType = NutritionEntry['mealType'];

interface Props {
  visible: boolean;
  mealType: MealType;
  onClose: () => void;
  onAdd: (entry: Omit<NutritionEntry, 'id' | 'userId' | 'date'>) => void;
}

const EMPTY_MANUAL = { foodName: '', calories: '', proteinG: '', carbsG: '', fatG: '', fiberG: '' };

export function AddFoodModal({ visible, mealType, onClose, onAdd }: Props) {
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const items = await searchFood(text);
        setResults(items);
      } finally {
        setSearching(false);
      }
    }, 500);
  }

  function handleSelectResult(item: FoodSearchResult) {
    onAdd({
      mealType,
      foodName: item.name + (item.brand ? ` (${item.brand})` : ''),
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      fiberG: item.fiberG,
      source: 'openfoodfacts',
    });
    onClose();
  }

  function handleManualAdd() {
    if (!manual.foodName || !manual.calories) {
      Alert.alert('Required', 'Food name and calories are required.');
      return;
    }
    onAdd({
      mealType,
      foodName: manual.foodName,
      calories: parseFloat(manual.calories) || 0,
      proteinG: parseFloat(manual.proteinG) || 0,
      carbsG: parseFloat(manual.carbsG) || 0,
      fatG: parseFloat(manual.fatG) || 0,
      fiberG: parseFloat(manual.fiberG) || 0,
      source: 'manual',
    });
    setManual(EMPTY_MANUAL);
    onClose();
  }

  async function handleBarcodeScan({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    try {
      const result = await lookupBarcode(data);
      if (result) {
        handleSelectResult(result);
      } else {
        Alert.alert('Not found', 'This barcode was not found in the database.', [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Failed to look up barcode.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  }

  function handleClose() {
    setQuery('');
    setResults([]);
    setManual(EMPTY_MANUAL);
    setScanned(false);
    setTab('search');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="title">Add Food</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['search', 'manual', 'barcode'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'search' ? '🔍 Search' : t === 'manual' ? '✏️ Manual' : '📷 Scan'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search tab */}
        {tab === 'search' && (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Search food..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={handleQueryChange}
              autoFocus
              clearButtonMode="while-editing"
            />
            {searching && <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />}
            <FlatList
              data={results}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultRow} onPress={() => handleSelectResult(item)} activeOpacity={0.7}>
                  <View style={styles.resultInfo}>
                    <Text variant="body">{item.name}</Text>
                    <Text variant="caption">
                      {item.brand ? `${item.brand} · ` : ''}{item.calories} kcal · P:{item.proteinG}g · C:{item.carbsG}g · F:{item.fatG}g
                    </Text>
                    {item.servingSize ? <Text variant="caption">Per {item.servingSize}</Text> : null}
                  </View>
                  <Text style={styles.addIcon}>+</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                query.length >= 2 && !searching
                  ? <Text variant="caption" style={styles.empty}>No results found</Text>
                  : null
              }
            />
          </>
        )}

        {/* Manual tab */}
        {tab === 'manual' && (
          <ScrollView contentContainerStyle={styles.manualForm} keyboardShouldPersistTaps="handled">
            <Text variant="label" style={styles.fieldLabel}>Food Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chicken Breast 200g"
              placeholderTextColor={Colors.textMuted}
              value={manual.foodName}
              onChangeText={(v) => setManual((m) => ({ ...m, foodName: v }))}
            />
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <Text variant="label" style={styles.fieldLabel}>Calories *</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad" value={manual.calories}
                  onChangeText={(v) => setManual((m) => ({ ...m, calories: v }))} />
              </View>
              <View style={styles.halfField}>
                <Text variant="label" style={styles.fieldLabel}>Protein (g)</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad" value={manual.proteinG}
                  onChangeText={(v) => setManual((m) => ({ ...m, proteinG: v }))} />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <Text variant="label" style={styles.fieldLabel}>Carbs (g)</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad" value={manual.carbsG}
                  onChangeText={(v) => setManual((m) => ({ ...m, carbsG: v }))} />
              </View>
              <View style={styles.halfField}>
                <Text variant="label" style={styles.fieldLabel}>Fat (g)</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad" value={manual.fatG}
                  onChangeText={(v) => setManual((m) => ({ ...m, fatG: v }))} />
              </View>
            </View>
            <Text variant="label" style={styles.fieldLabel}>Fiber (g)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad" value={manual.fiberG}
              onChangeText={(v) => setManual((m) => ({ ...m, fiberG: v }))} />
            <Button label="ADD FOOD" onPress={handleManualAdd} style={styles.addBtn} />
          </ScrollView>
        )}

        {/* Barcode tab */}
        {tab === 'barcode' && (
          <View style={styles.cameraContainer}>
            {!permission?.granted ? (
              <View style={styles.permissionView}>
                <Text variant="body" style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
                  Camera access is needed to scan barcodes.
                </Text>
                <Button label="Allow Camera" onPress={requestPermission} />
              </View>
            ) : (
              <>
                <CameraView
                  style={styles.camera}
                  barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
                />
                <View style={styles.scanOverlay}>
                  <View style={styles.scanFrame} />
                  <Text variant="caption" style={styles.scanHint}>
                    {scanned ? 'Looking up product...' : 'Point camera at barcode'}
                  </Text>
                </View>
                {scanned && <ActivityIndicator color={Colors.primary} style={styles.scanLoader} />}
              </>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, paddingBottom: Spacing.md,
  },
  closeBtn: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.bgHighlight },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold },
  tabTextActive: { color: Colors.primary },
  searchInput: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base,
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  resultInfo: { flex: 1 },
  addIcon: { fontSize: 22, color: Colors.primary, fontWeight: FontWeight.heavy },
  separator: { height: 1, backgroundColor: Colors.bgCardBorder, marginLeft: Spacing.xl },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl },
  manualForm: { padding: Spacing.xl, gap: Spacing.sm },
  fieldLabel: { marginBottom: 2 },
  input: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base,
  },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1 },
  addBtn: { marginTop: Spacing.lg },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  permissionView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 240,
    height: 120,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
  },
  scanHint: { marginTop: Spacing.xl, color: Colors.textPrimary },
  scanLoader: { position: 'absolute', bottom: 80, alignSelf: 'center' },
});
```

- [ ] **Step 6.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add src/components/nutrition/AddFoodModal.tsx && git commit -m "feat: add AddFoodModal with search, manual entry, and barcode scanner tabs"
```

---

## Task 7: Nutrition daily screen

**Files:**
- Modify: `app/(tabs)/nutrition.tsx`

- [ ] **Step 7.1: Replace nutrition shell with full daily view**

Replace the contents of `app/(tabs)/nutrition.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useNutritionStore } from '@/stores/nutrition';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CalorieRing } from '@/components/nutrition/CalorieRing';
import { MacroBar } from '@/components/nutrition/MacroBar';
import { MealSection } from '@/components/nutrition/MealSection';
import { AddFoodModal } from '@/components/nutrition/AddFoodModal';
import { Colors, Spacing } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { NutritionEntry } from '@/stores/nutrition';

type MealType = NutritionEntry['mealType'];

const MEALS: { type: MealType; title: string; icon: string }[] = [
  { type: 'breakfast', title: 'Breakfast', icon: '🌅' },
  { type: 'lunch',     title: 'Lunch',     icon: '☀️' },
  { type: 'dinner',    title: 'Dinner',    icon: '🌙' },
  { type: 'snack',     title: 'Snacks',    icon: '🍎' },
];

export default function NutritionScreen() {
  const { user } = useAuthStore();
  const { entries, goals, selectedDate, loadDay, loadGoals, addEntry, removeEntry, setSelectedDate } = useNutritionStore();
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null);

  useEffect(() => {
    if (!user) return;
    loadGoals(user.id);
    loadDay(user.id);
  }, [user]);

  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = entries.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = entries.reduce((s, e) => s + e.carbsG, 0);
  const totalFat = entries.reduce((s, e) => s + e.fatG, 0);

  function navigateDay(offset: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    const newDate = formatDate(d);
    setSelectedDate(newDate);
    if (user) loadDay(user.id, newDate);
  }

  const isToday = selectedDate === formatDate(new Date());

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with date navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateDay(-1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.dateBlock}>
          <Text variant="heading">Nutrition</Text>
          <Text variant="caption">{isToday ? 'Today' : selectedDate}</Text>
        </View>
        <TouchableOpacity onPress={() => navigateDay(1)} style={styles.navBtn} disabled={isToday}>
          <Text style={[styles.navArrow, isToday && { opacity: 0.3 }]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Calorie ring + macros */}
        <Card style={styles.summaryCard}>
          <View style={styles.ringRow}>
            <CalorieRing consumed={totalCalories} goal={goals.calories} />
            <View style={styles.macros}>
              <MacroBar label="Protein" consumed={totalProtein} goal={goals.proteinG} color={Colors.primary} />
              <MacroBar label="Carbs"   consumed={totalCarbs}   goal={goals.carbsG}   color={Colors.info} />
              <MacroBar label="Fat"     consumed={totalFat}     goal={goals.fatG}     color={Colors.purple} />
            </View>
          </View>
        </Card>

        {/* Goals link */}
        <TouchableOpacity onPress={() => router.push('/nutrition-goals')} style={styles.goalsLink}>
          <Text style={styles.goalsLinkText}>⚙️ Edit Goals · {goals.calories} kcal target</Text>
        </TouchableOpacity>

        {/* Meal sections */}
        {MEALS.map((meal) => (
          <MealSection
            key={meal.type}
            title={meal.title}
            icon={meal.icon}
            entries={entries.filter((e) => e.mealType === meal.type)}
            onAdd={() => setActiveMeal(meal.type)}
            onRemove={(id) => removeEntry(id)}
          />
        ))}

        {/* Weekly report link */}
        <TouchableOpacity onPress={() => router.push('/nutrition-report')} style={styles.reportLink}>
          <Text style={styles.reportLinkText}>📊 View Weekly Report →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add food modal */}
      {activeMeal && (
        <AddFoodModal
          visible={!!activeMeal}
          mealType={activeMeal}
          onClose={() => setActiveMeal(null)}
          onAdd={(entry) => { if (user) addEntry(user.id, entry); }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  navBtn: { padding: Spacing.sm },
  navArrow: { fontSize: 28, color: Colors.primary, fontWeight: '300' },
  dateBlock: { alignItems: 'center' },
  content: { padding: Spacing.xl, paddingTop: Spacing.sm },
  summaryCard: { marginBottom: Spacing.md },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  macros: { flex: 1, gap: Spacing.md },
  goalsLink: { alignItems: 'center', marginBottom: Spacing.lg },
  goalsLinkText: { fontSize: 13, color: Colors.textSecondary },
  reportLink: { alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  reportLinkText: { fontSize: 13, color: Colors.primary },
});
```

- [ ] **Step 7.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add "app/(tabs)/nutrition.tsx" && git commit -m "feat: nutrition daily screen with calorie ring, macro bars, meal sections"
```

---

## Task 8: Nutrition goals screen

**Files:**
- Create: `app/nutrition-goals.tsx`

- [ ] **Step 8.1: Create nutrition goals screen**

Create `app/nutrition-goals.tsx`:

```typescript
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useNutritionStore } from '@/stores/nutrition';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize } from '@/lib/constants';

export default function NutritionGoalsScreen() {
  const { user } = useAuthStore();
  const { goals, saveGoals } = useNutritionStore();
  const [calories, setCalories] = useState(String(goals.calories));
  const [protein, setProtein] = useState(String(goals.proteinG));
  const [carbs, setCarbs] = useState(String(goals.carbsG));
  const [fat, setFat] = useState(String(goals.fatG));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const c = parseInt(calories);
    const p = parseInt(protein);
    const ch = parseInt(carbs);
    const f = parseInt(fat);
    if (!c || !p || !ch || !f) {
      Alert.alert('Invalid', 'All fields must be positive numbers.');
      return;
    }
    setSaving(true);
    await saveGoals(user!.id, { calories: c, proteinG: p, carbsG: ch, fatG: f });
    setSaving(false);
    router.back();
  }

  const FIELDS = [
    { label: 'Daily Calories', value: calories, set: setCalories, unit: 'kcal', color: Colors.primary },
    { label: 'Protein', value: protein, set: setProtein, unit: 'g', color: Colors.primary },
    { label: 'Carbohydrates', value: carbs, set: setCarbs, unit: 'g', color: Colors.info },
    { label: 'Fat', value: fat, set: setFat, unit: 'g', color: Colors.purple },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="heading" style={styles.title}>Nutrition Goals</Text>
        <Text variant="caption" style={styles.subtitle}>Set your daily macro targets</Text>

        {FIELDS.map((f) => (
          <Card key={f.label} style={styles.fieldCard}>
            <Text variant="label" style={{ color: f.color }}>{f.label}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.set}
                keyboardType="number-pad"
                placeholderTextColor={Colors.textMuted}
              />
              <Text variant="caption" style={styles.unit}>{f.unit}</Text>
            </View>
          </Card>
        ))}

        <Button label="SAVE GOALS" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.md },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: Spacing.md },
  fieldCard: { gap: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    textAlign: 'center',
  },
  unit: { width: 36 },
  saveBtn: { marginTop: Spacing.md },
});
```

- [ ] **Step 8.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add app/nutrition-goals.tsx && git commit -m "feat: add nutrition goals screen"
```

---

## Task 9: Weekly nutrition report screen

**Files:**
- Create: `app/nutrition-report.tsx`

- [ ] **Step 9.1: Create weekly report screen**

Create `app/nutrition-report.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { nutritionLogs } from '@/db/schema';
import { eq, gte } from 'drizzle-orm';
import { useAuthStore } from '@/stores/auth';
import { useNutritionStore } from '@/stores/nutrition';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MacroBar } from '@/components/nutrition/MacroBar';
import { Colors, Spacing, FontSize, FontWeight } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface DayStats {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export default function NutritionReportScreen() {
  const { user } = useAuthStore();
  const { goals } = useNutritionStore();
  const [weekStats, setWeekStats] = useState<DayStats[]>([]);

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoStr = formatDate(weekAgo);

    db.select().from(nutritionLogs)
      .where(eq(nutritionLogs.userId, user.id))
      .then((rows) => {
        const filtered = rows.filter((r) => r.date >= weekAgoStr);
        // Group by date
        const byDate: Record<string, DayStats> = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = formatDate(d);
          byDate[ds] = { date: ds, calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
        }
        for (const r of filtered) {
          if (byDate[r.date]) {
            byDate[r.date].calories += r.calories ?? 0;
            byDate[r.date].proteinG += r.proteinG ?? 0;
            byDate[r.date].carbsG += r.carbsG ?? 0;
            byDate[r.date].fatG += r.fatG ?? 0;
          }
        }
        setWeekStats(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
      });
  }, [user]);

  const loggedDays = weekStats.filter((d) => d.calories > 0);
  const avgCalories = loggedDays.length > 0
    ? loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length
    : 0;
  const avgProtein = loggedDays.length > 0
    ? loggedDays.reduce((s, d) => s + d.proteinG, 0) / loggedDays.length
    : 0;
  const proteinGoalDays = weekStats.filter((d) => d.proteinG >= goals.proteinG).length;

  const maxCalories = Math.max(...weekStats.map((d) => d.calories), goals.calories);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="heading">Weekly Report</Text>
          <Text variant="caption">Last 7 days</Text>
        </View>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Days Logged', value: String(loggedDays.length) },
            { label: 'Avg Calories', value: Math.round(avgCalories).toString() },
            { label: 'Protein Goal', value: `${proteinGoalDays}/7` },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text variant="heading" color={Colors.primary}>{s.value}</Text>
              <Text variant="label">{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Calorie chart (bar chart) */}
        <Card style={styles.chartCard}>
          <Text variant="label" style={{ marginBottom: Spacing.md }}>Daily Calories</Text>
          <View style={styles.barChart}>
            {weekStats.map((day) => {
              const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
              const isToday = day.date === formatDate(new Date());
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <View key={day.date} style={styles.barCol}>
                  <View style={styles.barWrapper}>
                    <View style={[
                      styles.bar,
                      { height: `${barHeight}%` || '2%', backgroundColor: isToday ? Colors.primary : Colors.bgCardBorder },
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && { color: Colors.primary }]}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
          {/* Goal line indicator */}
          <Text variant="caption" style={{ marginTop: Spacing.sm }}>Goal: {goals.calories} kcal/day</Text>
        </Card>

        {/* Avg macros */}
        <Card style={styles.macrosCard}>
          <Text variant="label" style={{ marginBottom: Spacing.md }}>Average Daily Macros</Text>
          <View style={{ gap: Spacing.md }}>
            <MacroBar label="Protein" consumed={avgProtein} goal={goals.proteinG} color={Colors.primary} />
            <MacroBar label="Carbs"   consumed={loggedDays.reduce((s,d) => s + d.carbsG, 0) / (loggedDays.length || 1)} goal={goals.carbsG} color={Colors.info} />
            <MacroBar label="Fat"     consumed={loggedDays.reduce((s,d) => s + d.fatG, 0) / (loggedDays.length || 1)} goal={goals.fatG} color={Colors.purple} />
          </View>
        </Card>

        <Button label="← Back" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  header: { alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  chartCard: {},
  barChart: { flexDirection: 'row', height: 100, alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3, minHeight: 2 },
  barLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold },
  macrosCard: {},
});
```

- [ ] **Step 9.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add app/nutrition-report.tsx && git commit -m "feat: add weekly nutrition report screen with bar chart + avg macros"
```

---

## Task 10: Nutrition sync to Supabase

**Files:**
- Create: `src/lib/nutrition-sync.ts`

- [ ] **Step 10.1: Create sync function**

Create `src/lib/nutrition-sync.ts`:

```typescript
import { db } from '@/db/client';
import { nutritionLogs } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq, and, isNull } from 'drizzle-orm';

export async function syncNutritionLogs(userId: string, date: string) {
  // Get unsynced logs for this user/date
  const rows = await db
    .select()
    .from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, date)));

  const unsynced = rows.filter((r) => !r.syncedAt);
  if (unsynced.length === 0) return;

  const { error } = await supabase.from('nutrition_logs').upsert(
    unsynced.map((r) => ({
      id: r.id,
      user_id: r.userId,
      date: r.date,
      meal_type: r.mealType,
      food_name: r.foodName,
      calories: r.calories,
      protein_g: r.proteinG,
      carbs_g: r.carbsG,
      fat_g: r.fatG,
      fiber_g: r.fiberG,
      source: r.source,
    }))
  );
  if (error) throw error;

  // Mark as synced
  const now = new Date();
  for (const r of unsynced) {
    await db
      .update(nutritionLogs)
      .set({ syncedAt: now })
      .where(eq(nutritionLogs.id, r.id));
  }
}
```

- [ ] **Step 10.2: Call sync after adding an entry**

In `src/stores/nutrition.ts`, update the `addEntry` action to call sync after inserting. Add the import and call:

```typescript
// Add import at top of src/stores/nutrition.ts
import { syncNutritionLogs } from '@/lib/nutrition-sync';

// At the end of addEntry, after the set({...}):
// Fire-and-forget sync
syncNutritionLogs(userId, date).catch(console.warn);
```

The updated `addEntry` action:
```typescript
addEntry: async (userId, entry) => {
  const id = randomUUID();
  const date = get().selectedDate;
  await db.insert(nutritionLogs).values({
    id,
    userId,
    date,
    mealType: entry.mealType,
    foodName: entry.foodName,
    calories: entry.calories,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
    fiberG: entry.fiberG,
    source: entry.source,
  });
  set({
    entries: [
      ...get().entries,
      { id, userId, date, ...entry },
    ],
  });
  // Sync in background
  syncNutritionLogs(userId, date).catch(console.warn);
},
```

- [ ] **Step 10.3: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add src/lib/nutrition-sync.ts src/stores/nutrition.ts && git commit -m "feat: sync nutrition logs to Supabase after each entry"
```

---

## Task 11: Register new screens in root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 11.1: Add nutrition screens to Stack**

In `app/_layout.tsx`, add two new Stack.Screen entries:

```typescript
<Stack.Screen name="nutrition-goals" options={{ presentation: 'modal' }} />
<Stack.Screen name="nutrition-report" options={{ presentation: 'card' }} />
```

The full Stack should look like:
```typescript
<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
  <Stack.Screen name="(auth)" />
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="active-workout" options={{ presentation: 'fullScreenModal' }} />
  <Stack.Screen name="workout-summary" options={{ presentation: 'fullScreenModal' }} />
  <Stack.Screen name="nutrition-goals" options={{ presentation: 'modal' }} />
  <Stack.Screen name="nutrition-report" options={{ presentation: 'card' }} />
</Stack>
```

- [ ] **Step 11.2: Commit**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add app/_layout.tsx && git commit -m "feat: register nutrition-goals and nutrition-report screens in root layout"
```

---

## Task 12: Add nutritionGoals table to local SQLite schema

**Files:**
- Modify: `src/db/client.ts` — ensure `nutrition_goals` table exists with `protein_g`, `carbs_g`, `fat_g` columns

- [ ] **Step 12.1: Verify nutrition_goals table in initDatabase()**

Read `src/db/client.ts` and verify the `nutrition_goals` CREATE TABLE statement includes all columns needed by the store: `id`, `user_id`, `calories`, `protein_g`, `carbs_g`, `fat_g`. If already present, no change needed. If missing, add it to the `execAsync` call.

The table should be:
```sql
CREATE TABLE IF NOT EXISTS nutrition_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  calories INTEGER DEFAULT 2200,
  protein_g INTEGER DEFAULT 180,
  carbs_g INTEGER DEFAULT 250,
  fat_g INTEGER DEFAULT 70
);
```

And verify the `nutrition_logs` table has `synced_at INTEGER` column. If it doesn't exist, add:
```sql
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  meal_type TEXT,
  food_name TEXT NOT NULL,
  calories REAL NOT NULL,
  protein_g REAL DEFAULT 0,
  carbs_g REAL DEFAULT 0,
  fat_g REAL DEFAULT 0,
  fiber_g REAL DEFAULT 0,
  source TEXT DEFAULT 'manual',
  synced_at INTEGER
);
```

- [ ] **Step 12.2: Commit if changes were made**

```bash
cd /Users/saikrishna.das/Documents/sai/learn/gym-buddy && git add src/db/client.ts && git commit -m "fix: ensure nutrition_goals and nutrition_logs tables exist in local SQLite"
```

---

## Verification

- [ ] **Nutrition tab** → Shows calorie ring + macro bars (all at 0 initially)
- [ ] **Edit Goals** → Opens goals modal, save updates ring/bars immediately
- [ ] **"+ Add Food" in Breakfast** → Opens AddFoodModal
- [ ] **Search tab** → Type "banana" → results appear from Open Food Facts
- [ ] **Select a result** → Food appears in Breakfast section, calories update
- [ ] **Manual tab** → Enter food name + calories → ADD FOOD → appears in section
- [ ] **Barcode tab** → Shows camera, scans EAN barcode, looks up product
- [ ] **Remove a food** → ✕ removes from section, totals update
- [ ] **Date navigation** → ‹ and › arrows switch days, loads that day's entries
- [ ] **Weekly Report** → Shows bar chart with 7 days, avg macros
- [ ] **Supabase** → `nutrition_logs` table has new rows after adding food
