import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';

import { socialApi } from '@/api';
import { PostTile, usePostGridColumns } from '@/components/social/PostGrid';
import { contentWidth, EmptyState, ErrorState, GridSkeleton, Header, ListFooter, Screen } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { usePaged } from '@/hooks/usePaged';
import { go } from '@/lib/nav';
import { usePostOverrides } from '@/stores/posts';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';
import type { Activity } from '@/types';

const GAP = 2;

/** Private saved posts (GET /saved). Posts that leave the viewer's audience drop out server-side. */
export default function SavedScreen() {
  const { contentWidth: cw } = useLayout();
  const cols = usePostGridColumns();
  const tile = Math.floor((cw - GAP * (cols - 1)) / cols);
  const overrides = usePostOverrides((s) => s.overrides);
  const saved = usePaged<Activity>((p) => socialApi.saved(p.page), [], { refetchOnFocus: true });

  // Unsaved elsewhere in this session → hide immediately.
  const items = saved.items.filter((p) => overrides[p.id]?.saved !== false && !overrides[p.id]?.deleted);

  return (
    <Screen>
      <Header title="Saved" />
      <FlatList
        key={`saved-${cols}`}
        data={items}
        numColumns={cols}
        keyExtractor={(a) => String(a.id)}
        columnWrapperStyle={cols > 1 ? styles.row : undefined}
        contentContainerStyle={[contentWidth, styles.list]}
        renderItem={({ item }) => <PostTile post={item} size={tile} />}
        ListHeaderComponent={items.length ? <Text style={styles.hint}>Only you can see what you save.</Text> : undefined}
        ListEmptyComponent={
          saved.loading ? (
            <GridSkeleton columns={cols} rows={3} />
          ) : saved.error ? (
            <ErrorState error={saved.error} onRetry={saved.reload} />
          ) : (
            <EmptyState
              art="yoga"
              title="Nothing saved yet"
              message="Tap the bookmark on any post to keep it here. Only you can see your saved posts."
              actionLabel="Browse the feed"
              onAction={() => go('/(tabs)/home')}
            />
          )
        }
        ListFooterComponent={<ListFooter loading={saved.loadingMore} error={saved.moreError} onRetry={saved.loadMore} />}
        onEndReached={saved.loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={saved.refreshing} onRefresh={saved.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.xxl },
  row: { gap: GAP, marginBottom: GAP },
  hint: { ...Type.caption, color: Colors.muted, paddingHorizontal: ScreenPadding, paddingVertical: Spacing.md },
});
