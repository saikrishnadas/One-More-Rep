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
