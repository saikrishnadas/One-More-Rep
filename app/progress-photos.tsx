import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Image, Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/stores/auth';
import { useProgressPhotoStore } from '@/stores/progressPhotos';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { ChevronLeft, Camera, GitCompare } from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_W - Spacing.xl * 2 - Spacing.sm * 2) / 3;

export default function ProgressPhotosScreen() {
  const { user } = useAuthStore();
  const { photos, load, addPhoto, deletePhoto } = useProgressPhotoStore();
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  useEffect(() => { if (user) load(user.id); }, [user]);

  async function handleAddPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (!cam.granted) { Alert.alert('Permission needed', 'Please allow camera or photo library access.'); return; }
    }
    Alert.alert('Add Progress Photo', 'Choose source:', [
      {
        text: 'Camera', onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] });
          if (!result.canceled && user) await addPhoto(user.id, result.assets[0].uri);
        },
      },
      {
        text: 'Photo Library', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] });
          if (!result.canceled && user) await addPhoto(user.id, result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
    setCompareA(id); setCompareB(null);
  }

  const photoA = photos.find(p => p.id === compareA);
  const photoB = photos.find(p => p.id === compareB);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text variant="heading" style={{ flex: 1, textAlign: 'center' }}>Progress Photos</Text>
        <TouchableOpacity onPress={() => { setCompareMode(m => !m); setCompareA(null); setCompareB(null); }}>
          <GitCompare size={20} color={compareMode ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {compareMode && (
          <Card style={{ gap: Spacing.md }}>
            <Text variant="label" style={{ textAlign: 'center' }}>
              {!compareA ? 'Tap first photo' : !compareB ? 'Tap second photo' : 'Comparing!'}
            </Text>
            {compareA && compareB && (
              <View style={styles.compareRow}>
                <View style={styles.compareItem}>
                  <Image source={{ uri: photoA?.localUri }} style={styles.compareImage} />
                  <Text variant="caption" style={{ textAlign: 'center' }}>{photoA?.date}</Text>
                </View>
                <View style={styles.compareItem}>
                  <Image source={{ uri: photoB?.localUri }} style={styles.compareImage} />
                  <Text variant="caption" style={{ textAlign: 'center' }}>{photoB?.date}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={handleAddPhoto}>
          <Camera size={24} color={Colors.primary} />
          <Text style={styles.addBtnText}>Add Progress Photo</Text>
        </TouchableOpacity>

        {photos.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md }}>
            <Camera size={48} color={Colors.textMuted} />
            <Text variant="title" style={{ textAlign: 'center' }}>No photos yet</Text>
            <Text variant="caption" style={{ textAlign: 'center' }}>
              Track your physical transformation by adding a photo every 2 weeks.
            </Text>
          </Card>
        ) : (
          <View style={styles.grid}>
            {photos.slice().reverse().map(photo => {
              const isSelected = photo.id === compareA || photo.id === compareB;
              return (
                <TouchableOpacity
                  key={photo.id}
                  style={[styles.photoCell, isSelected && styles.photoCellSelected]}
                  onPress={() => handlePhotoPress(photo.id)}
                  onLongPress={() => Alert.alert('Delete?', '', [
                    { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(photo.id) },
                    { text: 'Cancel', style: 'cancel' },
                  ])}
                >
                  <Image source={{ uri: photo.localUri }} style={styles.photo} />
                  <Text style={styles.photoDate}>{photo.date.slice(5)}</Text>
                  {photo.weight && <Text style={styles.photoWeight}>{photo.weight}kg</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text variant="caption" style={styles.tip}>
          Tip: Take photos at the same time of day, same lighting, same pose for best comparison.
        </Text>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40 },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.lg, borderStyle: 'dashed', paddingVertical: Spacing.lg },
  addBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoCell: { width: PHOTO_SIZE, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.bgCard },
  photoCellSelected: { borderWidth: 2, borderColor: Colors.primary },
  photo: { width: PHOTO_SIZE, height: PHOTO_SIZE * (4 / 3) },
  photoDate: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', paddingVertical: 2 },
  photoWeight: { fontSize: FontSize.xs, color: Colors.primary, textAlign: 'center', paddingBottom: 2 },
  compareRow: { flexDirection: 'row', gap: Spacing.md },
  compareItem: { flex: 1, gap: 4 },
  compareImage: { width: '100%', aspectRatio: 3 / 4, borderRadius: Radius.md },
  tip: { textAlign: 'center', fontStyle: 'italic' },
});
