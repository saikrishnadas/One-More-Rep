import { create } from 'zustand';
import { db } from '@/db/client';
import { progressPhotos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as FileSystem from 'expo-file-system';
import { generateId, formatDate } from '@/lib/utils';

interface ProgressPhoto {
  id: string; userId: string; date: string;
  localUri: string; notes: string | null; weight: number | null;
}

interface ProgressPhotoStore {
  photos: ProgressPhoto[];
  load: (userId: string) => Promise<void>;
  addPhoto: (userId: string, tempUri: string, opts?: { notes?: string; weight?: number }) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
}

export const useProgressPhotoStore = create<ProgressPhotoStore>((set, get) => ({
  photos: [],
  load: async (userId) => {
    const rows = await db.select().from(progressPhotos).where(eq(progressPhotos.userId, userId));
    set({ photos: rows as ProgressPhoto[] });
  },
  addPhoto: async (userId, tempUri, opts = {}) => {
    const id = generateId();
    const dir = FileSystem.documentDirectory + 'progress-photos/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const ext = tempUri.split('.').pop() ?? 'jpg';
    const destUri = `${dir}${id}.${ext}`;
    await FileSystem.copyAsync({ from: tempUri, to: destUri });

    const photo: ProgressPhoto = {
      id, userId, date: formatDate(new Date()),
      localUri: destUri, notes: opts.notes ?? null, weight: opts.weight ?? null,
    };
    await db.insert(progressPhotos).values(photo);
    set(s => ({ photos: [...s.photos, photo].sort((a, b) => a.date.localeCompare(b.date)) }));
  },
  deletePhoto: async (id) => {
    const photo = get().photos.find(p => p.id === id);
    if (photo) await FileSystem.deleteAsync(photo.localUri, { idempotent: true });
    await db.delete(progressPhotos).where(eq(progressPhotos.id, id));
    set(s => ({ photos: s.photos.filter(p => p.id !== id) }));
  },
}));
