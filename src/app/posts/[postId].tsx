import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, errorMessage, socialApi } from '@/api';
import { PostCard } from '@/components/social/PostCard';
import { ActionSheet, Avatar, contentWidth, EmptyState, ErrorState, Header, ListFooter, PostSkeleton, ReportSheet, Screen, Touchable } from '@/components/ui';
import { usePaged, type PagedState } from '@/hooks/usePaged';
import { useQuery } from '@/hooks/useQuery';
import { timeAgo } from '@/lib/format';
import { go } from '@/lib/nav';
import { usePost, usePostOverrides } from '@/stores/posts';
import { useFeature, useSession } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { Activity, Comment } from '@/types';

/** Post detail: carousel, appreciate/save, comments (add, delete, report). */
export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ postId: string }>();
  const postId = Number(Array.isArray(params.postId) ? params.postId[0] : params.postId);
  const valid = Number.isFinite(postId) && postId > 0;

  const post = useQuery(() => socialApi.post(postId), [postId], { enabled: valid });
  const comments = usePaged<Comment>((p) => socialApi.comments(postId, p.page), [postId], { enabled: valid && !!post.data });

  const refresh = async () => {
    await Promise.all([post.refresh(), comments.refresh()]);
  };

  let body: ReactNode;
  if (!valid) body = <ErrorState error={new ApiError(404, 'not_found', 'Not found.')} />;
  else if (post.loading) body = <PostSkeleton />;
  else if (post.error || !post.data) body = <ErrorState error={post.error} onRetry={post.reload} />;
  else body = <PostBody post={post.data} comments={comments} onRefresh={refresh} refreshing={post.refreshing || comments.refreshing} />;

  return (
    <Screen>
      <Header title="Post" />
      {body}
    </Screen>
  );
}

function PostBody({
  post: base,
  comments,
  onRefresh,
  refreshing,
}: {
  post: Activity;
  comments: PagedState<Comment>;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const post = usePost(base);
  const patch = usePostOverrides((s) => s.patch);
  const commentsFeature = useFeature('comments');
  const me = useSession((s) => s.me?.student);
  const canComment = commentsFeature && post.comments_enabled;

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menuFor, setMenuFor] = useState<Comment | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const c = await socialApi.addComment(post.id, body);
      setText('');
      comments.setItems((items) => [...items, c]);
      if (!c.pending) patch(post.id, { comments: post.comments_count + 1 });
      else Alert.alert('Comment sent', 'Your school reviews comments before others can see them.');
    } catch (e) {
      Alert.alert(e instanceof ApiError && e.code === 'comments_disabled' ? 'Comments are off' : 'Could not post comment', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const remove = (c: Comment) => {
    Alert.alert('Delete comment?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await socialApi.deleteComment(c.id);
            comments.setItems((items) => items.filter((x) => x.id !== c.id));
            if (!c.pending) patch(post.id, { comments: Math.max(0, post.comments_count - 1) });
          } catch (e) {
            Alert.alert('Could not delete', errorMessage(e));
          }
        },
      },
    ]);
  };

  const canDelete = (c: Comment) => c.is_mine || post.is_mine;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={commentsFeature ? comments.items : []}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={contentWidth}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View>
            <PostCard post={base} detail />
            {commentsFeature ? (
              <Text style={styles.commentsTitle} accessibilityRole="header">
                Comments{post.comments_count ? ` · ${post.comments_count}` : ''}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <CommentRow
            comment={item}
            onLongPress={() => setMenuFor(item)}
            onMenu={() => setMenuFor(item)}
          />
        )}
        ListEmptyComponent={
          !commentsFeature ? undefined : comments.loading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loading} />
          ) : comments.error ? (
            <ErrorState error={comments.error} onRetry={comments.reload} compact />
          ) : (
            <EmptyState compact icon="chatbubbles-outline" title="No comments yet" message={canComment ? 'Say something kind to start the conversation.' : undefined} />
          )
        }
        ListFooterComponent={<ListFooter loading={comments.loadingMore} error={comments.moreError} onRetry={comments.loadMore} />}
        onEndReached={comments.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      />

      {commentsFeature ? (
        <SafeAreaView edges={['bottom']} style={styles.composerWrap}>
          {canComment ? (
            <View style={[styles.composer, contentWidth]}>
              <Avatar uri={me?.avatar_url} name={me?.display_name} size={32} />
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Add a comment…"
                placeholderTextColor={Colors.subtle}
                multiline
                maxLength={500}
                style={styles.input}
                accessibilityLabel="Write a comment"
              />
              <Touchable
                onPress={send}
                disabled={!text.trim() || sending}
                scaleTo={0.9}
                accessibilityLabel="Post comment"
                style={[styles.send, (!text.trim() || sending) && styles.sendOff]}>
                {sending ? <ActivityIndicator color={Colors.white} size="small" /> : <Ionicons name="arrow-up" size={18} color={Colors.white} />}
              </Touchable>
            </View>
          ) : (
            <Text style={[styles.closed, contentWidth]}>Comments are turned off for this post.</Text>
          )}
        </SafeAreaView>
      ) : null}

      <ActionSheet
        visible={!!menuFor}
        onClose={() => setMenuFor(null)}
        actions={
          menuFor
            ? [
                ...(menuFor.author?.id && !menuFor.author.is_me
                  ? [{ label: `View ${menuFor.author.display_name}`, icon: 'person-outline' as const, onPress: () => go(`/students/${menuFor.author?.id}`) }]
                  : []),
                ...(canDelete(menuFor) ? [{ label: 'Delete comment', icon: 'trash-outline' as const, destructive: true, onPress: () => remove(menuFor) }] : []),
                ...(!menuFor.is_mine ? [{ label: 'Report comment', icon: 'flag-outline' as const, destructive: true, onPress: () => setReportId(menuFor.id) }] : []),
              ]
            : []
        }
      />
      <ReportSheet visible={reportId !== null} onClose={() => setReportId(null)} type="comment" targetId={reportId} title="Report comment" />
    </KeyboardAvoidingView>
  );
}

function CommentRow({ comment, onLongPress, onMenu }: { comment: Comment; onLongPress: () => void; onMenu: () => void }) {
  const a = comment.author;
  return (
    <Touchable scaleTo={1} onLongPress={onLongPress} delayLongPress={350} accessibilityHint="Long press for options" style={styles.comment}>
      <Touchable
        scaleTo={0.92}
        disabled={!a?.id}
        onPress={() => (a?.is_me ? go('/(tabs)/profile') : go(`/students/${a?.id}`))}
        accessibilityLabel={`Open ${a?.display_name ?? 'student'} profile`}>
        <Avatar uri={a?.avatar_url} name={a?.display_name} size={32} />
      </Touchable>
      <View style={styles.commentBody}>
        <Text style={styles.commentText}>
          <Text style={styles.commentName}>{a?.display_name ?? 'Student'} </Text>
          {comment.body}
        </Text>
        <View style={styles.commentMeta}>
          <Text style={styles.metaText}>{timeAgo(comment.created_at)}</Text>
          {comment.pending ? (
            <View style={styles.pending}>
              <Ionicons name="time-outline" size={11} color={Colors.warning} />
              <Text style={styles.pendingText}>Pending review</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Touchable scaleTo={0.9} onPress={onMenu} accessibilityLabel="Comment options" style={styles.commentMore}>
        <Ionicons name="ellipsis-horizontal" size={16} color={Colors.subtle} />
      </Touchable>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { padding: Spacing.xl },
  commentsTitle: { ...Type.subheading, color: Colors.ink, paddingHorizontal: ScreenPadding, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingLeft: ScreenPadding, paddingRight: Spacing.xs, paddingVertical: Spacing.sm },
  commentBody: { flex: 1, gap: Spacing.xs, paddingTop: 2 },
  commentText: { ...Type.body, color: Colors.body },
  commentName: { fontWeight: '600', color: Colors.ink },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaText: { ...Type.caption, color: Colors.subtle },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.warningTint, borderRadius: Radius.pill, paddingHorizontal: Spacing.sm - 2, paddingVertical: 1 },
  pendingText: { ...Type.micro, color: Colors.warning },
  commentMore: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  composerWrap: { backgroundColor: Colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.hairline },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingHorizontal: ScreenPadding, paddingVertical: Spacing.sm },
  input: {
    flex: 1,
    ...Type.body,
    color: Colors.ink,
    maxHeight: 110,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.sm + 2,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceAlt,
  },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.4 },
  closed: { ...Type.small, color: Colors.muted, textAlign: 'center', padding: Spacing.md },
});
