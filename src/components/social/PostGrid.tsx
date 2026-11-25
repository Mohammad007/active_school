import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Touchable } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { go } from '@/lib/nav';
import { Colors, Spacing } from '@/theme';
import type { Activity } from '@/types';

/** Number of grid columns for post tiles: 3 on phones, 4-5 on tablets. */
export function usePostGridColumns() {
  const { contentWidth, isTablet } = useLayout();
  return isTablet ? (contentWidth >= 600 ? 4 : 3) + (contentWidth > 900 ? 1 : 0) : 3;
}

/** Square post tile for profile grids (multi-photo icon, verified tick). */
export function PostTile({ post, size, onPress }: { post: Activity; size: number; onPress?: () => void }) {
  const photo = post.photos[0];
  return (
    <Touchable
      scaleTo={0.97}
      onPress={onPress ?? (() => go(`/posts/${post.id}`))}
      accessibilityLabel={post.title}
      style={{ width: size, height: size }}>
      {photo ? (
        <Image source={{ uri: photo.thumb_url }} style={styles.fill} contentFit="cover" transition={150} recyclingKey={String(photo.id)} />
      ) : (
        <View style={[styles.fill, styles.empty]}>
          <Ionicons name="image-outline" size={22} color={Colors.subtle} />
        </View>
      )}
      {post.photos.length > 1 ? (
        <View style={styles.badge}>
          <Ionicons name="copy" size={14} color={Colors.white} />
        </View>
      ) : null}
      {post.verified ? (
        <View style={[styles.badge, styles.badgeLeft]}>
          <Ionicons name="checkmark-circle" size={15} color={Colors.white} />
        </View>
      ) : null}
    </Touchable>
  );
}

/** Non-virtualised grid for embedding inside a ScrollView/FlatList header. */
export function PostGrid({ posts, width, columns, gap = 2 }: { posts: Activity[]; width: number; columns: number; gap?: number }) {
  const size = Math.floor((width - gap * (columns - 1)) / columns);
  return (
    <View style={[styles.grid, { gap }]}>
      {posts.map((p) => (
        <PostTile key={p.id} post={p} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%', backgroundColor: Colors.skeleton },
  empty: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: Spacing.xs + 2, right: Spacing.xs + 2 },
  badgeLeft: { right: undefined, left: Spacing.xs + 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
