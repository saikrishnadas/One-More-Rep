import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import { BADGES } from '@/lib/xp-service';
import {
  searchUsers, sendFriendRequest, acceptFriendRequest, declineFriendRequest,
  removeFriend, loadFriendships, loadFeed, toggleReaction, loadLeaderboard,
  FeedItem, LeaderboardEntry, Friendship, FriendProfile,
} from '@/lib/social';
import { formatVolume, formatDuration } from '@/lib/utils';

type Tab = 'feed' | 'friends' | 'leaderboard';

const REACTION_EMOJIS = ['🔥', '💪', '👊', '🏆', '❤️'];

export default function SocialScreen() {
  const { user, profile } = useAuthStore();
  const [tab, setTab] = useState<Tab>('feed');
  const [loading, setLoading] = useState(false);

  // Friends state
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);

  // Feed state
  const [feed, setFeed] = useState<FeedItem[]>([]);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const friendIds = friends.map(f => f.friend.id);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { friends: f, pendingReceived: pr, pendingSent: ps } = await loadFriendships(user.id);
      setFriends(f);
      setPendingReceived(pr);
      setPendingSent(ps);
      const fIds = f.map(x => x.friend.id);
      const [feedData, lbData] = await Promise.all([
        loadFeed(fIds, user.id),
        loadLeaderboard(fIds, user.id),
      ]);
      setFeed(feedData);
      setLeaderboard(lbData);
    } catch (e) {
      console.warn('Social load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await searchUsers(q, user!.id);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(friendId: string, username: string) {
    try {
      await sendFriendRequest(user!.id, friendId);
      setSearchResults(r => r.filter(u => u.id !== friendId));
      Alert.alert('Request sent!', `Friend request sent to ${username}`);
    } catch {
      Alert.alert('Error', 'Could not send request. Already sent?');
    }
  }

  async function handleAccept(friendship: Friendship) {
    await acceptFriendRequest(friendship.id);
    await loadAll();
  }

  async function handleDecline(friendship: Friendship) {
    await declineFriendRequest(friendship.id);
    setPendingReceived(p => p.filter(x => x.id !== friendship.id));
  }

  async function handleRemove(friendship: Friendship) {
    Alert.alert('Remove Friend', `Remove ${friendship.friend.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => { await removeFriend(friendship.id); await loadAll(); },
      },
    ]);
  }

  async function handleReaction(item: FeedItem, emoji: string) {
    if (!user) return;
    await toggleReaction(user.id, item.id, item.type, emoji);
    // Optimistic update
    setFeed(prev => prev.map(f => {
      if (f.id !== item.id) return f;
      const existing = f.reactions.find(r => r.emoji === emoji);
      if (existing) {
        return {
          ...f, reactions: f.reactions.map(r => r.emoji === emoji
            ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
            : r
          ).filter(r => r.count > 0),
        };
      }
      return { ...f, reactions: [...f.reactions, { emoji, count: 1, userReacted: true }] };
    }));
  }

  function timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  // ── Render sections ─────────────────────────────────────────────────────────

  function renderFeedItem(item: FeedItem) {
    const badge = item.type === 'badge' ? BADGES.find(b => b.id === item.data.badgeId) : null;
    return (
      <Card key={item.id} style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.feedMeta}>
            <Text style={styles.feedUsername}>{item.username}</Text>
            <Text variant="caption">{timeAgo(item.timestamp)}</Text>
          </View>
        </View>

        {item.type === 'workout' ? (
          <View style={styles.feedContent}>
            <Text style={styles.feedAction}>💪 Completed a workout</Text>
            {item.data.sessionName && item.data.sessionName !== 'Workout' && (
              <Text variant="body" style={{ color: Colors.primary }}>{item.data.sessionName}</Text>
            )}
            <View style={styles.feedStats}>
              <Text variant="caption">{formatVolume(item.data.volumeKg ?? 0)} kg</Text>
              <Text variant="caption">·</Text>
              <Text variant="caption">{item.data.setCount} sets</Text>
              <Text variant="caption">·</Text>
              <Text variant="caption">{formatDuration(item.data.durationSeconds ?? 0)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.feedContent}>
            <Text style={styles.feedAction}>
              {badge ? `${badge.icon} Unlocked "${badge.name}"` : '🏅 Earned a badge'}
            </Text>
          </View>
        )}

        {/* Reactions */}
        <View style={styles.reactionRow}>
          {REACTION_EMOJIS.map(emoji => {
            const r = item.reactions.find(x => x.emoji === emoji);
            return (
              <TouchableOpacity
                key={emoji}
                style={[styles.reactionBtn, r?.userReacted && styles.reactionBtnActive]}
                onPress={() => handleReaction(item, emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {r && r.count > 0 && <Text style={styles.reactionCount}>{r.count}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>
    );
  }

  function renderFriendsTab() {
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        {/* Search */}
        <Text variant="label" style={styles.sectionLabel}>Add Friends</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {searching && <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.sm }} />}
        {searchResults.map(u => {
          const alreadySent = pendingSent.some(p => p.friendId === u.id);
          const alreadyFriend = friends.some(f => f.friend.id === u.id);
          return (
            <View key={u.id} style={styles.searchRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{u.username[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.feedUsername}>{u.username}</Text>
                <Text variant="caption">Level {u.level}</Text>
              </View>
              {alreadyFriend ? (
                <Text variant="caption" color={Colors.success}>Friends ✓</Text>
              ) : alreadySent ? (
                <Text variant="caption" color={Colors.textMuted}>Sent</Text>
              ) : (
                <TouchableOpacity style={styles.addBtn} onPress={() => handleSendRequest(u.id, u.username)}>
                  <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Pending requests */}
        {pendingReceived.length > 0 && (
          <>
            <Text variant="label" style={styles.sectionLabel}>Friend Requests</Text>
            {pendingReceived.map(f => (
              <View key={f.id} style={styles.requestRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{f.friend.username[0]?.toUpperCase()}</Text>
                </View>
                <Text style={[styles.feedUsername, { flex: 1 }]}>{f.friend.username}</Text>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(f)}>
                  <Text style={styles.acceptText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(f)}>
                  <Text style={styles.declineText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Friends list */}
        <Text variant="label" style={styles.sectionLabel}>
          Friends ({friends.length})
        </Text>
        {friends.length === 0 ? (
          <Text variant="caption" style={styles.emptyText}>
            No friends yet. Search by username to add people!
          </Text>
        ) : friends.map(f => (
          <View key={f.id} style={styles.friendRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{f.friend.username[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedUsername}>{f.friend.username}</Text>
              <Text variant="caption">Level {f.friend.level} · {f.friend.xp} XP</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(f)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    );
  }

  function renderLeaderboard() {
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <Text variant="caption" style={{ marginBottom: Spacing.md, textAlign: 'center' }}>
          Weekly volume ranking · friends + you
        </Text>
        {leaderboard.map(entry => (
          <Card key={entry.userId} style={[styles.lbCard, entry.isMe && styles.lbCardMe]}>
            <View style={styles.lbRank}>
              <Text style={[styles.lbRankText, entry.rank <= 3 && { color: Colors.primary }]}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedUsername}>
                {entry.username}{entry.isMe ? ' (you)' : ''}
              </Text>
              <Text variant="caption">Lvl {entry.level} · {entry.weeklyWorkouts} workouts</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.lbVolume}>{formatVolume(entry.weeklyVolume)} kg</Text>
              <Text variant="caption">{entry.xp} XP</Text>
            </View>
          </Card>
        ))}
        {leaderboard.length === 0 && (
          <Text variant="caption" style={styles.emptyText}>
            Add friends to see the leaderboard!
          </Text>
        )}
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="heading">Social</Text>
        {loading && <ActivityIndicator color={Colors.primary} />}
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {(['feed', 'friends', 'leaderboard'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'feed' ? '📰 Feed' : t === 'friends' ? '👥 Friends' : '🏆 Rank'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed tab */}
      {tab === 'feed' && (
        <FlatList
          data={feed}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.tabContent}
          renderItem={({ item }) => renderFeedItem(item)}
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <Text style={{ fontSize: 48 }}>👥</Text>
              <Text variant="title" style={{ marginTop: Spacing.md }}>No activity yet</Text>
              <Text variant="caption">Add friends to see their workouts here!</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}

      {tab === 'friends' && renderFriendsTab()}
      {tab === 'leaderboard' && renderLeaderboard()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  tabs: {
    flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.bgHighlight },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold },
  tabTextActive: { color: Colors.primary },
  tabContent: { padding: Spacing.xl, paddingTop: Spacing.sm },

  // Feed
  feedCard: { gap: Spacing.md },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.base, fontWeight: FontWeight.heavy, color: Colors.primary },
  feedMeta: { flex: 1 },
  feedUsername: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  feedContent: { gap: Spacing.xs },
  feedAction: { fontSize: FontSize.base, color: Colors.textPrimary },
  feedStats: { flexDirection: 'row', gap: Spacing.sm },
  reactionRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    backgroundColor: Colors.bgCardBorder, borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'transparent',
  },
  reactionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  reactionEmoji: { fontSize: FontSize.md },
  reactionCount: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.bold },

  // Friends
  sectionLabel: { marginBottom: Spacing.sm, marginTop: Spacing.md },
  searchInput: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary,
    fontSize: FontSize.base, marginBottom: Spacing.sm,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  addBtn: {
    backgroundColor: Colors.bgHighlight, borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full,
  },
  addBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  acceptBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: '#fff', fontWeight: FontWeight.heavy },
  declineBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bgCardBorder, alignItems: 'center', justifyContent: 'center' },
  declineText: { color: Colors.textMuted, fontWeight: FontWeight.heavy },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  removeBtn: { padding: Spacing.sm },
  removeBtnText: { fontSize: FontSize.base, color: Colors.textMuted },
  emptyText: { textAlign: 'center', marginTop: Spacing.lg },

  // Leaderboard
  lbCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  lbCardMe: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  lbRank: { width: 36, alignItems: 'center' },
  lbRankText: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textSecondary },
  lbVolume: { fontSize: FontSize.lg, fontWeight: FontWeight.heavy, color: Colors.primary },

  // Empty feed
  emptyFeed: { alignItems: 'center', paddingTop: 80 },
});
