import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { ActionSheet, Avatar, Pill, ReportSheet, Touchable } from '@/components/ui';
import { compactNumber, formatDate, timeAgo } from '@/lib/format';
import { go } from '@/lib/nav';
import { toggleAppreciate, toggleSave, usePost } from '@/stores/posts';
import { useFeature } from '@/stores/session';
import { Colors, Radius, Shadows, Spacing, Type } from '@/theme';
import type { Activity } from '@/types';

import { PhotoCarousel } from './PhotoCarousel';

/** Instagram-style activity card used in the feed, saved posts and profiles. */
export const PostCard = memo(function PostCard({ post: base, detail }: { post: Activity; detail?: boolean }) {
  const post = usePost(base);
  const commentsOn = useFeature('comments');
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [expanded, setExpanded] = useState(!!detail);
  const heart = useSharedValue(1);
  const burst = useSharedValue(0);

  const author = post.author;
  const open = () => go(`/posts/${post.id}`);
  const openAuthor = () => {
    if (!author?.id) return;
    go(author.is_me ? '/(tabs)/profile' : `/students/${author.id}`);
  };

  const appreciate = () => {
    heart.value = withSequence(withTiming(1.25, { duration: 110 }), withSpring(1));
    toggleAppreciate(post);
  };
  const doubleTap = () => {
    burst.value = withSequence(withTiming(1, { duration: 120 }), withTiming(1, { duration: 380 }), withTiming(0, { duration: 200 }));
    if (!post.appreciated_by_me) appreciate();
  };

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heart.value }] }));
  const burstStyle = useAnimatedStyle(() => ({ opacity: burst.value, transform: [{ scale: 0.6 + burst.value * 0.4 }] }));

  const caption = post.caption?.trim();
  const long = !!caption && caption.length > 140;

  return (
    <View style={detail ? styles.flat : styles.card}>
      <View style={styles.head}>
        <Touchable onPress={openAuthor} scaleTo={0.98} style={styles.author} accessibilityLabel={`Open ${author?.display_name ?? 'student'} profile`}>
          <Avatar uri={author?.avatar_url} name={author?.display_name} size={40} ring={!!author?.is_me} />
          <View style={styles.authorText}>
            <Text style={styles.name} numberOfLines={1}>
              {author?.display_name ?? 'Student'}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {[author?.class_label, timeAgo(post.published_at ?? post.created_at)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </Touchable>
        <Pill label={post.level_label} tone="info" />
        <Touchable onPress={() => setMenu(true)} scaleTo={0.9} style={styles.more} accessibilityLabel="More options">
          <Ionicons name="ellipsis-horizontal" size={18} color={Colors.muted} />
        </Touchable>
      </View>

      <View style={detail ? undefined : styles.media}>
        <PhotoCarousel photos={post.photos} onPress={detail ? undefined : open} onDoublePress={doubleTap} title={post.title} />
        <Animated.View pointerEvents="none" style={[styles.burst, burstStyle]}>
          <Ionicons name="heart" size={88} color={Colors.white} />
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <Touchable
          onPress={appreciate}
          scaleTo={0.9}
          style={styles.action}
          accessibilityLabel={post.appreciated_by_me ? 'Remove appreciation' : 'Appreciate'}
          accessibilityState={{ selected: post.appreciated_by_me }}>
          <Animated.View style={heartStyle}>
            <Ionicons name={post.appreciated_by_me ? 'heart' : 'heart-outline'} size={25} color={post.appreciated_by_me ? Colors.heart : Colors.ink} />
          </Animated.View>
        </Touchable>
        {commentsOn && post.comments_enabled ? (
          <Touchable onPress={open} scaleTo={0.9} style={styles.action} accessibilityLabel="Comments">
            <Ionicons name="chatbubble-outline" size={23} color={Colors.ink} />
          </Touchable>
        ) : null}
        <View style={styles.flex} />
        <Touchable
          onPress={() => toggleSave(post)}
          scaleTo={0.9}
          style={styles.action}
          accessibilityLabel={post.saved_by_me ? 'Remove from saved' : 'Save'}
          accessibilityState={{ selected: post.saved_by_me }}>
          <Ionicons name={post.saved_by_me ? 'bookmark' : 'bookmark-outline'} size={23} color={post.saved_by_me ? Colors.primary : Colors.ink} />
        </Touchable>
      </View>

      <View style={styles.body}>
        {post.appreciations_count > 0 ? (
          <Text style={styles.count}>
            {compactNumber(post.appreciations_count)} {post.appreciations_count === 1 ? 'appreciation' : 'appreciations'}
          </Text>
        ) : null}
        <Text style={styles.title} onPress={detail ? undefined : open} suppressHighlighting>
          {post.title}
        </Text>
        {caption ? (
          <Text style={styles.caption} numberOfLines={expanded ? undefined : 3} onPress={long && !expanded ? () => setExpanded(true) : undefined} suppressHighlighting>
            {caption}
          </Text>
        ) : null}
        {long && !expanded ? (
          <Text style={styles.moreText} onPress={() => setExpanded(true)} accessibilityRole="button">
            more
          </Text>
        ) : null}
        <View style={styles.tags}>
          {post.category ? <Pill label={post.category.name} colour={post.category.colour} /> : null}
          {post.result !== 'participation' ? <Pill label={post.result_label} tone="accent" icon="trophy" /> : null}
          {post.verified ? <Pill label={post.points ? `Verified · ${post.points} pts` : 'Verified'} tone="success" icon="checkmark-circle" /> : null}
        </View>
        {!detail && commentsOn && post.comments_enabled && post.comments_count > 0 ? (
          <Text style={styles.viewComments} onPress={open} accessibilityRole="link">
            View {post.comments_count === 1 ? '1 comment' : `all ${compactNumber(post.comments_count)} comments`}
          </Text>
        ) : null}
        {detail && post.occurred_on ? <Text style={styles.date}>{formatDate(post.occurred_on)}</Text> : null}
      </View>

      <ActionSheet
        visible={menu}
        onClose={() => setMenu(false)}
        actions={[
          ...(!detail ? [{ label: 'View post', icon: 'open-outline' as const, onPress: open }] : []),
          ...(author?.id && !author.is_me ? [{ label: `View ${author.display_name}`, icon: 'person-outline' as const, onPress: openAuthor }] : []),
          ...(post.is_mine ? [{ label: 'Manage in My submissions', icon: 'create-outline' as const, onPress: () => go(`/submissions/${post.id}`) }] : []),
          ...(!post.is_mine ? [{ label: 'Report post', icon: 'flag-outline' as const, destructive: true, onPress: () => setReport(true) }] : []),
        ]}
      />
      <ReportSheet visible={report} onClose={() => setReport(false)} type="activity" targetId={post.id} title="Report post" />
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  /** Post detail: edge-to-edge photo. */
  flat: {
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
    marginBottom: Spacing.sm,
  },
  /** Feed / grids: rounded card with an inset photo. */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    overflow: 'hidden',
    ...Shadows.card,
  },
  media: { marginHorizontal: Spacing.md, borderRadius: Radius.md, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', paddingLeft: Spacing.md, paddingRight: Spacing.xs, paddingVertical: Spacing.sm + 2, gap: Spacing.sm },
  author: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, minHeight: 44 },
  authorText: { flex: 1 },
  name: { ...Type.small, fontWeight: '600', color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted },
  more: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  burst: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xs, paddingTop: Spacing.xs },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.xs },
  count: { ...Type.small, fontWeight: '600', color: Colors.ink },
  title: { ...Type.subheading, color: Colors.ink },
  caption: { ...Type.body, color: Colors.body },
  moreText: { ...Type.small, color: Colors.muted, marginTop: -2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2, marginTop: Spacing.xs },
  viewComments: { ...Type.small, color: Colors.muted, paddingVertical: Spacing.xs },
  date: { ...Type.caption, color: Colors.subtle },
});
