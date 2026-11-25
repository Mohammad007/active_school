import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { socialApi } from '@/api';
import { BannerCarousel } from '@/components/feed/BannerCarousel';
import { StoriesRow } from '@/components/feed/StoriesRow';
import { PostCard } from '@/components/social/PostCard';
import { Avatar, characterFor, EmptyState, ErrorState, IconButton, ListFooter, Logo, PostSkeleton, Screen, Touchable, wideWidth } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { usePaged } from '@/hooks/usePaged';
import { useQuery } from '@/hooks/useQuery';
import { go } from '@/lib/nav';
import { usePostOverrides } from '@/stores/posts';
import { useSession } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { Activity } from '@/types';

/** Class feed: stories (categories), banners, search and the cursor-paginated feed. Grid on tablets. */
export default function HomeScreen() {
  const categories = useSession((s) => s.categories);
  const unread = useSession((s) => s.unreadCount);
  const refreshUnread = useSession((s) => s.refreshUnread);
  const me = useSession((s) => s.me?.student);
  const overrides = usePostOverrides((s) => s.overrides);
  const { cardColumns, wideWidth: available } = useLayout();
  const cols = cardColumns(360, 3);
  const cellWidth = cols > 1 ? (available - Spacing.md * (cols + 1)) / cols : undefined;

  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      refreshUnread();
    }, [refreshUnread]),
  );

  const banners = useQuery(() => socialApi.banners('home'), []);
  const feed = usePaged<Activity>((p) => socialApi.feed({ cursor: p.cursor, category, q }), [category, q]);

  const posts = useMemo(() => feed.items.filter((p) => !overrides[p.id]?.deleted), [feed.items, overrides]);

  const onRefresh = useCallback(() => {
    banners.reload();
    refreshUnread();
    return feed.refresh();
  }, [banners, feed, refreshUnread]);

  const filtered = !!q || category !== null;

  const header = (
    <View style={styles.headerBlock}>
      <StoriesRow categories={categories} selected={category} onSelect={setCategory} onCreate={() => go('/(tabs)/create')} me={me} />
      {!filtered ? <BannerCarousel banners={banners.data} loading={banners.loading} /> : null}
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={Colors.subtle} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search activities or classmates"
          placeholderTextColor={Colors.subtle}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.searchInput}
          accessibilityLabel="Search the feed"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={Colors.subtle} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.appBar}>
        <View style={[styles.appBarInner, wideWidth]}>
          <Touchable onPress={() => go('/(tabs)/profile')} scaleTo={0.92} accessibilityLabel="Your profile" style={styles.me}>
            <Avatar uri={me?.avatar_url} name={me?.display_name} character={characterFor(me?.gender)} size={38} ring />
          </Touchable>
          <View style={styles.logo}>
            <Logo height={24} />
          </View>
          <IconButton icon="bookmark-outline" label="Saved posts" onPress={() => go('/saved')} />
          <IconButton icon="notifications-outline" label="Notifications" badge={unread} onPress={() => go('/notifications')} />
        </View>
      </View>
      <FlatList
        key={`cols-${cols}`}
        data={posts}
        numColumns={cols}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <View style={cols > 1 ? [styles.cellGrid, { width: cellWidth }] : styles.cell}>
            <PostCard post={item} />
          </View>
        )}
        columnWrapperStyle={cols > 1 ? styles.columns : undefined}
        ListHeaderComponent={header}
        ListEmptyComponent={
          feed.loading ? (
            <View style={styles.cell}>
              <PostSkeleton />
              <PostSkeleton />
            </View>
          ) : feed.error ? (
            <ErrorState error={feed.error} onRetry={feed.reload} />
          ) : filtered ? (
            <EmptyState art="running" title="No matching activities" message="Try a different word or category." />
          ) : (
            <EmptyState
              art="football"
              title="No activities yet"
              message="Be the first in your class to share what you have been up to."
              actionLabel="Share an activity"
              onAction={() => go('/(tabs)/create')}
            />
          )
        }
        ListFooterComponent={posts.length ? <ListFooter loading={feed.loadingMore} error={feed.moreError} onRetry={feed.loadMore} end={!feed.hasMore && posts.length > 4 ? 'You are all caught up' : undefined} /> : undefined}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[wideWidth, styles.list]}
        removeClippedSubviews
        windowSize={7}
        initialNumToRender={cols * 3}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  appBar: { backgroundColor: Colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  appBarInner: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: Spacing.sm, gap: Spacing.xs },
  me: { padding: Spacing.xs },
  logo: { flex: 1, paddingLeft: Spacing.xs },
  headerBlock: { paddingBottom: Spacing.md },
  list: { paddingBottom: Spacing.xl },
  cell: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  cellGrid: { marginBottom: Spacing.md },
  columns: { gap: Spacing.md, paddingHorizontal: Spacing.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: ScreenPadding,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
  },
  searchInput: { flex: 1, ...Type.body, color: Colors.ink, paddingVertical: Spacing.sm },
});
