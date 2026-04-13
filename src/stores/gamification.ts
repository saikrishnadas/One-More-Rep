import { create } from 'zustand';
import { BadgeDef, BADGES } from '@/lib/xp-service';
import { supabase } from '@/lib/supabase';

export interface EarnedBadge {
  id: string;
  badgeId: string;
  badge: BadgeDef;
  earnedAt: string;
}

interface GamificationState {
  earnedBadges: EarnedBadge[];
  earnedBadgeIds: string[];
  pendingLevelUp: { oldLevel: number; newLevel: number } | null;
  pendingBadges: BadgeDef[];
  loadBadges: (userId: string) => Promise<void>;
  setPendingLevelUp: (data: { oldLevel: number; newLevel: number } | null) => void;
  addPendingBadges: (badges: BadgeDef[]) => void;
  clearPendingBadge: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  earnedBadges: [],
  earnedBadgeIds: [],
  pendingLevelUp: null,
  pendingBadges: [],

  loadBadges: async (userId) => {
    const { data } = await supabase
      .from('user_badges')
      .select('id, badge_id, earned_at')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    const earned: EarnedBadge[] = (data ?? []).map((r: any) => ({
      id: r.id ?? r.badge_id,
      badgeId: r.badge_id,
      badge: BADGES.find(b => b.id === r.badge_id) ?? { id: r.badge_id, name: r.badge_id, icon: '🏅', description: '' },
      earnedAt: r.earned_at,
    }));

    set({ earnedBadges: earned, earnedBadgeIds: earned.map(e => e.badgeId) });
  },

  setPendingLevelUp: (data) => set({ pendingLevelUp: data }),
  addPendingBadges: (badges) => set(s => ({ pendingBadges: [...s.pendingBadges, ...badges] })),
  clearPendingBadge: () => set(s => ({ pendingBadges: s.pendingBadges.slice(1) })),
}));
