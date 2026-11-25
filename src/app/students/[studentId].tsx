import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError, errorMessage, socialApi } from '@/api';
import { PostTile, usePostGridColumns } from '@/components/social/PostGrid';
import {
  ActionSheet,
  Avatar,
  Button,
  contentWidth,
  EmptyState,
  ErrorState,
  GridSkeleton,
  Header,
  IconButton,
  ListFooter,
  ListSkeleton,
  Pill,
  ReportSheet,
  Screen,
  Stat,
} from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { usePaged } from '@/hooks/usePaged';
import { useQuery } from '@/hooks/useQuery';
import { compactNumber } from '@/lib/format';
import { iconName } from '@/lib/icons';
import { goReplace } from '@/lib/nav';
import { Colors, Radius, ScreenPadding, Spacing, Type, safeColour, tint } from '@/theme';
import type { Activity, PeerProfile } from '@/types';

const GAP = 2;

/** A classmate's profile: display fields, approved posts and badges. Block / report from the menu. */
export default function StudentProfileScreen() {
  const params = useLocalSearchParams<{ studentId: string }>();
  const studentId = Number(Array.isArray(params.studentId) ? params.studentId[0] : params.studentId);
  const valid = Number.isFinite(studentId) && studentId > 0;
  const { contentWidth: cw } = useLayout();
  const cols = usePostGridColumns();
  const tile = Math.floor((cw - GAP * (cols - 1)) / cols);

  const profile = useQuery(() => socialApi.student(studentId), [studentId], { enabled: valid });
  const blocked = !!profile.data?.blocked_by_me;
  const posts = usePaged<Activity>((p) => socialApi.studentPosts(studentId, p.page), [studentId], {
    enabled: valid && !!profile.data && !blocked && !profile.data.is_me,
  });

  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data?.is_me) goReplace('/(tabs)/profile');
  }, [profile.data?.is_me]);

  const toggleBlock = () => {
    const p = profile.data;
    if (!p?.id) return;
    const unblock = p.blocked_by_me;
    Alert.alert(
      unblock ? `Unblock ${p.display_name}?` : `Block ${p.display_name}?`,
      unblock
        ? 'Their posts and comments will be visible to you again.'
        : 'You will no longer see their posts or comments, and they will not see yours. They are not told. Points and rankings are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: unblock ? 'Unblock' : 'Block',
          style: unblock ? 'default' : 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const res = unblock ? await socialApi.unblock(p.id as number) : await socialApi.block(p.id as number);
              profile.setData((prev) => (prev ? { ...prev, blocked_by_me: res.blocked } : prev));
              if (!res.blocked) posts.reload();
            } catch (e) {
              Alert.alert('Could not update', errorMessage(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    await Promise.all([profile.refresh(), blocked ? null : posts.refresh()]);
  };

  const p = profile.data;
  const right = p ? <IconButton icon="ellipsis-horizontal" label="More options" onPress={() => setMenu(true)} /> : null;

  let content: ReactNode;
  if (!valid) content = <ErrorState error={new ApiError(404, 'not_found', 'Not found.')} />;
  else if (profile.loading) content = <ListSkeleton rows={3} />;
  else if (profile.error || !p) content = <ErrorState error={profile.error} onRetry={profile.reload} />;
  else {
    content = (
      <FlatList
        key={`grid-${cols}`}
        data={blocked ? [] : posts.items}
        numColumns={cols}
        keyExtractor={(a) => String(a.id)}
        columnWrapperStyle={cols > 1 ? styles.gridRow : undefined}
        contentContainerStyle={[contentWidth, styles.list]}
        renderItem={({ item }) => <PostTile post={item} size={tile} />}
        ListHeaderComponent={<ProfileHeader profile={p} blocked={blocked} busy={busy} onUnblock={toggleBlock} />}
        ListEmptyComponent={
          blocked ? undefined : posts.loading ? (
            <GridSkeleton columns={cols} rows={2} />
          ) : posts.error ? (
            <ErrorState error={posts.error} onRetry={posts.reload} compact />
          ) : (
            <EmptyState compact art="football" title="No posts yet" message={`${p.display_name} has not shared any activities yet.`} />
          )
        }
        ListFooterComponent={blocked ? undefined : <ListFooter loading={posts.loadingMore} error={posts.moreError} onRetry={posts.loadMore} />}
        onEndReached={posts.loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={profile.refreshing || posts.refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      />
    );
  }

  return (
    <Screen>
      <Header title={p?.display_name ?? 'Profile'} right={right} />
      {content}
      <ActionSheet
        visible={menu}
        onClose={() => setMenu(false)}
        actions={[
          { label: blocked ? 'Unblock' : 'Block', icon: blocked ? 'lock-open-outline' : 'ban-outline', destructive: !blocked, onPress: toggleBlock },
          { label: 'Report profile', icon: 'flag-outline', destructive: true, onPress: () => setReport(true) },
        ]}
      />
      <ReportSheet visible={report} onClose={() => setReport(false)} type="student" targetId={p?.id ?? null} title="Report profile" />
    </Screen>
  );
}

function ProfileHeader({ profile: p, blocked, busy, onUnblock }: { profile: PeerProfile; blocked: boolean; busy: boolean; onUnblock: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.top}>
        <Avatar uri={p.avatar_url} name={p.display_name} size={80} />
        <View style={styles.stats}>
          <Stat value={compactNumber(p.posts_count)} label={p.posts_count === 1 ? 'Post' : 'Posts'} />
          <Stat value={p.badges.length} label={p.badges.length === 1 ? 'Badge' : 'Badges'} />
        </View>
      </View>
      <View style={styles.identity}>
        <Text style={styles.name}>{p.display_name}</Text>
        <Text style={styles.sub}>{[p.class_label, p.school?.name].filter(Boolean).join(' · ')}</Text>
        {p.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}
        {p.interests.length ? (
          <View style={styles.interests}>
            {p.interests.map((i) => (
              <Pill key={i} label={i} tone="info" />
            ))}
          </View>
        ) : null}
      </View>

      {p.badges.length && !blocked ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges}>
          {p.badges.map((b) => {
            const c = safeColour(b.colour, Colors.accent);
            return (
              <View key={b.id} style={styles.badge} accessible accessibilityLabel={`${b.name} badge`}>
                <View style={[styles.badgeIcon, { backgroundColor: tint(c, 0.14) }]}>
                  <Ionicons name={iconName(b.icon)} size={22} color={c} />
                </View>
                <Text style={styles.badgeName} numberOfLines={2}>
                  {b.name}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      ) : null}

      {blocked ? (
        <View style={styles.blocked}>
          <Ionicons name="ban-outline" size={22} color={Colors.muted} />
          <Text style={styles.blockedTitle}>You blocked {p.display_name}</Text>
          <Text style={styles.blockedText}>Their posts and comments are hidden from you. Blocking does not change anyone’s points.</Text>
          <Button label="Unblock" onPress={onUnblock} loading={busy} variant="outline" size="sm" />
        </View>
      ) : (
        <View style={styles.gridLabel}>
          <Ionicons name="grid-outline" size={16} color={Colors.ink} />
          <Text style={styles.gridLabelText}>Activities</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.xxl },
  gridRow: { gap: GAP, marginBottom: GAP },
  header: { backgroundColor: Colors.background },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingHorizontal: ScreenPadding, paddingTop: Spacing.lg },
  stats: { flex: 1, flexDirection: 'row' },
  identity: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.md, gap: Spacing.xs },
  name: { ...Type.heading, color: Colors.ink },
  sub: { ...Type.small, color: Colors.muted },
  bio: { ...Type.body, color: Colors.body, marginTop: Spacing.xs },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2, marginTop: Spacing.sm },
  badges: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.lg, gap: Spacing.md },
  badge: { width: 68, alignItems: 'center', gap: Spacing.xs },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  badgeName: { ...Type.micro, color: Colors.body, textAlign: 'center' },
  blocked: {
    margin: ScreenPadding,
    padding: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  blockedTitle: { ...Type.subheading, color: Colors.ink },
  blockedText: { ...Type.small, color: Colors.muted, textAlign: 'center', marginBottom: Spacing.xs },
  gridLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
  gridLabelText: { ...Type.small, fontWeight: '600', color: Colors.ink },
});
