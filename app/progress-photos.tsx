import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/stores/auth';
import { useProgressPhotoStore } from '@/stores/progressPhotos';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { ChevronLeft, Camera, GitCompare, CheckCircle2 } from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const PHOTO_W = SCREEN_W - Spacing.xl * 2 - 48; // 48 = timeline column width

interface ProgressPhoto {
  id: string;
  date: string;
  localUri: string;
  weight?: number | null;
  notes?: string | null;
}

function groupByMonth(photos: ProgressPhoto[]): { key: string; label: string; items: ProgressPhoto[] }[] {
  const map = new Map<string, ProgressPhoto[]>();
  // newest first
  const sorted = [...photos].sort((a, b) => b.date.localeCompare(a.date));
  sorted.forEach(p => {
    const key = p.date.slice(0, 7); // 'YYYY-MM'
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  });
  return Array.from(map.entries()).map(([key, items]) => {
    const [y, m] = key.split('-');
    const label = new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    return { key, label, items };
  });
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('default', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function ProgressPhotosScreen() {
  const { user } = useAuthStore();
  const { photos, load, addPhoto, deletePhoto } = useProgressPhotoStore();
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  useEffect(() => { if (user) load(user.id); }, [user]);

  async function handleAddPhoto() {
    const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!libraryPerm.granted && !camPerm.granted) {
      Alert.alert('Permission needed', 'Please allow camera or photo library access.');
      return;
    }
    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }[] = [];
    if (camPerm.granted) {
      options.push({
        text: 'Camera', onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] });
          if (!result.canceled && user) await addPhoto(user.id, result.assets[0].uri);
        },
      });
    }
    if (libraryPerm.granted) {
      options.push({
        text: 'Photo Library', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] });
          if (!result.canceled && user) await addPhoto(user.id, result.assets[0].uri);
        },
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Add Progress Photo', 'Choose source:', options);
  }

  function handlePhotoPress(id: string) {
    if (!compareMode) {
      Alert.alert('Photo options', '', [
        { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(id) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (!compareA) { setCompareA(id); return; }
    if (!compareB && id !== compareA) { setCompareB(id); return; }
    // third tap resets selection
    setCompareA(id); setCompareB(null);
  }

  const photoA = photos.find(p => p.id === compareA);
  const photoB = photos.find(p => p.id === compareB);
  const groups = groupByMonth(photos as ProgressPhoto[]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text variant="heading" style={{ flex: 1, textAlign: 'center' }}>Progress Photos</Text>
        <TouchableOpacity
          style={[styles.compareToggle, compareMode && styles.compareToggleActive]}
          onPress={() => { setCompareMode(m => !m); setCompareA(null); setCompareB(null); }}
        >
          <GitCompare size={18} color={compareMode ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Compare panel */}
        {compareMode && (
          <Card style={styles.compareCard}>
            <Text variant="label" style={{ textAlign: 'center', marginBottom: Spacing.sm }}>
              {!compareA ? '① Tap a photo to select' : !compareB ? '② Tap another photo to compare' : ''}
            </Text>
            {compareA && compareB ? (
              <View style={styles.comparePair}>
                <View style={styles.compareSlot}>
                  <Image source={{ uri: photoA?.localUri }} style={styles.compareImg} />
                  <View style={styles.compareBadge}>
                    <Text style={styles.compareBadgeText}>BEFORE</Text>
                  </View>
                  <Text variant="caption" style={styles.compareDate}>{photoA?.date}</Text>
                  {photoA?.weight ? <Text style={styles.compareWeight}>{photoA.weight} kg</Text> : null}
                </View>
                <View style={styles.compareSlot}>
                  <Image source={{ uri: photoB?.localUri }} style={styles.compareImg} />
                  <View style={[styles.compareBadge, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.compareBadgeText}>AFTER</Text>
                  </View>
                  <Text variant="caption" style={styles.compareDate}>{photoB?.date}</Text>
                  {photoB?.weight ? <Text style={styles.compareWeight}>{photoB.weight} kg</Text> : null}
                </View>
              </View>
            ) : compareA ? (
              <View style={styles.compareSingle}>
                <Image source={{ uri: photoA?.localUri }} style={styles.compareSingleImg} />
                <Text variant="caption" style={{ textAlign: 'center', marginTop: 4 }}>{photoA?.date}</Text>
              </View>
            ) : null}
            {compareA && compareB && (
              <TouchableOpacity
                style={styles.resetCompareBtn}
                onPress={() => { setCompareA(null); setCompareB(null); }}
              >
                <Text style={styles.resetCompareTxt}>Reset comparison</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Add photo button */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAddPhoto}>
          <Camera size={20} color={Colors.primary} />
          <Text style={styles.addBtnText}>Add Progress Photo</Text>
        </TouchableOpacity>

        {/* Empty state */}
        {photos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Camera size={48} color={Colors.textMuted} />
            <Text variant="title" style={{ textAlign: 'center' }}>No photos yet</Text>
            <Text variant="caption" style={{ textAlign: 'center' }}>
              Track your transformation — add a photo every 2 weeks.
            </Text>
          </Card>
        ) : (
          /* Timeline */
          <View>
            {groups.map((group, gi) => (
              <View key={group.key}>
                {/* Month separator */}
                <View style={styles.monthRow}>
                  <View style={styles.monthLine} />
                  <Text style={styles.monthLabel}>{group.label}</Text>
                  <View style={styles.monthLine} />
                </View>

                {group.items.map((photo, idx) => {
                  const isLast = idx === group.items.length - 1 && gi === groups.length - 1;
                  const isSelectedA = photo.id === compareA;
                  const isSelectedB = photo.id === compareB;
                  const isSelected = isSelectedA || isSelectedB;

                  return (
                    <View key={photo.id} style={styles.timelineRow}>
                      {/* Left: line + dot */}
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, isSelected && styles.timelineDotSelected]} />
                        {!isLast && <View style={styles.timelineLine} />}
                      </View>

                      {/* Right: photo card */}
                      <TouchableOpacity
                        style={[styles.photoCard, isSelected && styles.photoCardSelected,
                          isSelectedA && { borderColor: Colors.warning },
                          isSelectedB && { borderColor: Colors.primary },
                        ]}
                        onPress={() => handlePhotoPress(photo.id)}
                        onLongPress={() => Alert.alert('Delete photo?', formatDay(photo.date), [
                          { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(photo.id) },
                          { text: 'Cancel', style: 'cancel' },
                        ])}
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{ uri: photo.localUri }}
                          style={styles.photoImg}
                          resizeMode="cover"
                        />

                        {/* Selection overlay */}
                        {isSelected && (
                          <View style={styles.selectionOverlay}>
                            <CheckCircle2
                              size={28}
                              color={isSelectedA ? Colors.warning : Colors.primary}
                              fill={Colors.bg}
                            />
                            <Text style={[styles.selectionLabel, { color: isSelectedA ? Colors.warning : Colors.primary }]}>
                              {isSelectedA ? 'BEFORE' : 'AFTER'}
                            </Text>
                          </View>
                        )}

                        <View style={styles.photoMeta}>
                          <Text style={styles.photoDay}>{formatDay(photo.date)}</Text>
                          {photo.weight ? (
                            <View style={styles.weightPill}>
                              <Text style={styles.weightPillText}>{photo.weight} kg</Text>
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <Text variant="caption" style={styles.tip}>
          Long-press any photo to delete · Tap the compare icon to compare two photos
        </Text>
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgCardBorder,
  },
  backBtn: { width: 40 },
  compareToggle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.bgCardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  compareToggleActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  content: { padding: Spacing.xl, gap: Spacing.lg },

  // Compare panel
  compareCard: { gap: Spacing.md },
  comparePair: { flexDirection: 'row', gap: Spacing.sm },
  compareSlot: { flex: 1, gap: 4 },
  compareImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: Radius.md },
  compareBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.warning,
    borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  compareBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.heavy, color: '#fff' },
  compareDate: { textAlign: 'center' },
  compareWeight: { textAlign: 'center', fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
  compareSingle: { alignItems: 'center' },
  compareSingleImg: { width: '50%', aspectRatio: 3 / 4, borderRadius: Radius.md },
  resetCompareBtn: { alignItems: 'center', paddingTop: Spacing.xs },
  resetCompareTxt: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Add button
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgHighlight, borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.lg, borderStyle: 'dashed', paddingVertical: Spacing.lg,
  },
  addBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },

  // Empty
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },

  // Month header
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md, marginTop: Spacing.sm },
  monthLine: { flex: 1, height: 1, backgroundColor: Colors.bgCardBorder },
  monthLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.heavy, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  timelineLeft: { width: 20, alignItems: 'center', paddingTop: 10 },
  timelineDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.bgCard, borderWidth: 2, borderColor: Colors.bgCardBorder,
  },
  timelineDotSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '40' },
  timelineLine: { flex: 1, width: 2, backgroundColor: Colors.bgCardBorder, marginTop: 4, minHeight: 40 },

  // Photo card
  photoCard: {
    flex: 1, borderRadius: Radius.lg, overflow: 'hidden',
    backgroundColor: Colors.bgCard, borderWidth: 2, borderColor: 'transparent',
  },
  photoCardSelected: { borderWidth: 2 },
  photoImg: { width: '100%', height: PHOTO_W * (4 / 3) },
  selectionOverlay: {
    position: 'absolute', top: Spacing.md, right: Spacing.md,
    alignItems: 'center', gap: 2,
    backgroundColor: Colors.bg + 'cc', borderRadius: Radius.md, padding: 6,
  },
  selectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.heavy },
  photoMeta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
  },
  photoDay: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  weightPill: {
    backgroundColor: Colors.primary + '20', borderWidth: 1, borderColor: Colors.primary,
    borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  weightPillText: { fontSize: FontSize.xs, fontWeight: FontWeight.heavy, color: Colors.primary },

  tip: { textAlign: 'center', fontStyle: 'italic', marginTop: Spacing.sm },
});
