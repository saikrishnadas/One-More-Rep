import { supabase } from '@/lib/supabase';

export interface FriendProfile {
  id: string;
  username: string;
  xp: number;
  level: number;
  goal: string | null;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'declined';
  friend: FriendProfile;
}

export interface FeedItem {
  id: string;
  type: 'workout' | 'badge';
  userId: string;
  username: string;
  data: {
    // workout
    sessionName?: string;
    volumeKg?: number;
    setCount?: number;
    durationSeconds?: number;
    // badge
    badgeId?: string;
    badgeIcon?: string;
    badgeName?: string;
  };
  timestamp: string;
  reactions: { emoji: string; count: number; userReacted: boolean }[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  level: number;
  weeklyVolume: number;
  weeklyWorkouts: number;
  xp: number;
  isMe: boolean;
}

/** Search users by username prefix */
export async function searchUsers(query: string, myId: string): Promise<FriendProfile[]> {
  if (query.length < 2) return [];
  const { data } = await supabase
    .from('profiles')
    .select('id, username, xp, level, goal')
    .ilike('username', `%${query}%`)
    .neq('id', myId)
    .limit(10);
  return (data ?? []) as FriendProfile[];
}

/** Send a friend request */
export async function sendFriendRequest(userId: string, friendId: string): Promise<void> {
  await supabase.from('friendships').insert({
    user_id: userId,
    friend_id: friendId,
    status: 'pending',
  });
}

/** Accept a friend request */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
}

/** Decline a friend request */
export async function declineFriendRequest(friendshipId: string): Promise<void> {
  await supabase.from('friendships').update({ status: 'declined' }).eq('id', friendshipId);
}

/** Remove a friend */
export async function removeFriend(friendshipId: string): Promise<void> {
  await supabase.from('friendships').delete().eq('id', friendshipId);
}

/** Get all friendships for a user (accepted + pending received) */
export async function loadFriendships(userId: string): Promise<{
  friends: Friendship[];
  pendingReceived: Friendship[];
  pendingSent: Friendship[];
}> {
  const { data } = await supabase
    .from('friendships')
    .select(`
      id, user_id, friend_id, status,
      user:profiles!friendships_user_id_fkey(id, username, xp, level, goal),
      friend:profiles!friendships_friend_id_fkey(id, username, xp, level, goal)
    `)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  const rows = (data ?? []) as any[];
  const friends: Friendship[] = [];
  const pendingReceived: Friendship[] = [];
  const pendingSent: Friendship[] = [];

  for (const r of rows) {
    const isSender = r.user_id === userId;
    const friendProfile: FriendProfile = isSender
      ? { id: r.friend.id, username: r.friend.username, xp: r.friend.xp, level: r.friend.level, goal: r.friend.goal }
      : { id: r.user.id, username: r.user.username, xp: r.user.xp, level: r.user.level, goal: r.user.goal };

    const entry: Friendship = { id: r.id, userId: r.user_id, friendId: r.friend_id, status: r.status, friend: friendProfile };

    if (r.status === 'accepted') {
      friends.push(entry);
    } else if (r.status === 'pending' && !isSender) {
      pendingReceived.push(entry);
    } else if (r.status === 'pending' && isSender) {
      pendingSent.push(entry);
    }
  }

  return { friends, pendingReceived, pendingSent };
}

/** Load activity feed from friends (last 20 events) */
export async function loadFeed(friendIds: string[], myId: string): Promise<FeedItem[]> {
  if (friendIds.length === 0) return [];
  const allIds = [...friendIds, myId];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Load recent workouts from friends
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, user_id, name, total_volume_kg, set_count, duration_seconds, ended_at')
    .in('user_id', allIds)
    .not('ended_at', 'is', null)
    .gte('ended_at', weekAgo.toISOString())
    .order('ended_at', { ascending: false })
    .limit(10);

  // Load recent badge unlocks
  const { data: badges } = await supabase
    .from('user_badges')
    .select('id, user_id, badge_id, earned_at')
    .in('user_id', allIds)
    .gte('earned_at', weekAgo.toISOString())
    .order('earned_at', { ascending: false })
    .limit(10);

  // Load profiles for display names
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', allIds);
  const profileMap: Record<string, string> = {};
  (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p.username; });

  // Load reactions for these items
  const sessionIds = (sessions ?? []).map((s: any) => s.id);
  const badgeLogIds = (badges ?? []).map((b: any) => b.id);
  const { data: reactions } = await supabase
    .from('reactions')
    .select('target_id, emoji, user_id')
    .in('target_id', [...sessionIds, ...badgeLogIds]);

  function getReactions(targetId: string, myUserId: string) {
    const recs = (reactions ?? []).filter((r: any) => r.target_id === targetId);
    const counts: Record<string, number> = {};
    recs.forEach((r: any) => { counts[r.emoji] = (counts[r.emoji] ?? 0) + 1; });
    return Object.entries(counts).map(([emoji, count]) => ({
      emoji, count,
      userReacted: recs.some((r: any) => r.user_id === myUserId && r.emoji === emoji),
    }));
  }

  const feed: FeedItem[] = [
    ...(sessions ?? []).map((s: any): FeedItem => ({
      id: s.id,
      type: 'workout',
      userId: s.user_id,
      username: profileMap[s.user_id] ?? 'Unknown',
      data: {
        sessionName: s.name ?? 'Workout',
        volumeKg: s.total_volume_kg ?? 0,
        setCount: s.set_count ?? 0,
        durationSeconds: s.duration_seconds ?? 0,
      },
      timestamp: s.ended_at,
      reactions: getReactions(s.id, myId),
    })),
    ...(badges ?? []).map((b: any): FeedItem => ({
      id: b.id,
      type: 'badge',
      userId: b.user_id,
      username: profileMap[b.user_id] ?? 'Unknown',
      data: { badgeId: b.badge_id },
      timestamp: b.earned_at,
      reactions: getReactions(b.id, myId),
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

  return feed;
}

/** Add or remove a reaction (toggle) */
export async function toggleReaction(userId: string, targetId: string, targetType: string, emoji: string): Promise<void> {
  const { data } = await supabase
    .from('reactions')
    .select('id')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .eq('emoji', emoji)
    .single();

  if (data) {
    await supabase.from('reactions').delete().eq('id', data.id);
  } else {
    await supabase.from('reactions').insert({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
      emoji,
    });
  }
}

/** Weekly leaderboard among friends + self */
export async function loadLeaderboard(friendIds: string[], myId: string): Promise<LeaderboardEntry[]> {
  const allIds = [...friendIds, myId];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, xp, level')
    .in('id', allIds);

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('user_id, total_volume_kg')
    .in('user_id', allIds)
    .gte('started_at', weekAgo.toISOString());

  const volumeByUser: Record<string, number> = {};
  const countByUser: Record<string, number> = {};
  (sessions ?? []).forEach((s: any) => {
    volumeByUser[s.user_id] = (volumeByUser[s.user_id] ?? 0) + (s.total_volume_kg ?? 0);
    countByUser[s.user_id] = (countByUser[s.user_id] ?? 0) + 1;
  });

  return (profiles ?? [])
    .map((p: any, i: number): LeaderboardEntry => ({
      rank: 0,
      userId: p.id,
      username: p.username,
      level: p.level,
      xp: p.xp,
      weeklyVolume: volumeByUser[p.id] ?? 0,
      weeklyWorkouts: countByUser[p.id] ?? 0,
      isMe: p.id === myId,
    }))
    .sort((a, b) => b.weeklyVolume - a.weeklyVolume)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}
