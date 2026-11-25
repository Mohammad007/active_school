import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { achievementsApi, socialApi } from '@/api';
import { BadgeIcon } from '@/components/profile/BadgeIcon';
import { PostTile, usePostGridColumns } from '@/components/social/PostGrid';
import {
  Avatar, characterFor,
  Button,
  Chip,
  contentWidth,
  EmptyState,
  ErrorState,
  GridSkeleton,
  Header,
  IconButton,
  ListFooter,
  ListRow,
  Screen,
  Section,
  SectionTitle,
  Stat,
  Touchable,
} from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { usePaged } from '@/hooks/usePaged';
import { useQuery } from '@/hooks/useQuery';
import { compactNumber } from '@/lib/format';
import { go } from '@/lib/nav';
import { useFeature, useSession } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';

const GAP = 2;

export default function ProfileScreen() {
  const me = useSession((s) => s.me);
  const refreshMe = useSession((s) => s.refreshMe);
  const student = me?.student ?? null;
  const stats = me?.stats;
  const portfolioOn = useFeature('portfolio');
  const goalsOn = useFeature('goals');
  const rewardsOn = useFeature('rewards');
  const columns = usePostGridColumns();
  const { contentWidth: width } = useLayout();
  const tile = Math.floor((width - GAP * (columns - 1)) / columns);

  const studentId = student?.id ?? 0;
  const posts = usePaged((p) => socialApi.studentPosts(studentId, p.page), [studentId], { enabled: studentId > 0 });
  const badges = useQuery(() => achievementsApi.list(), [], { enabled: portfolioOn && !!student });
  const earned = (badges.data ?? []).filter((b) => b.earned);

  useFocusEffect(
    useCallback(() => {
      refreshMe().catch(() => undefined);
    }, [refreshMe]),
  );

  const onRefresh = async () => {
    await Promise.all([posts.refresh(), refreshMe().catch(() => undefined), portfolioOn ? badges.reload() : Promise.resolve()]);
  };

  const header = student ? (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Avatar uri={student.avatar_url} name={student.display_name} character={characterFor(student.gender)} size={84} ring />
          <View style={styles.stats}>
            <Stat value={compactNumber(stats?.posts ?? 0)} label="Posts" />
            <Stat value={compactNumber(stats?.points_total ?? 0)} label="Points" onPress={() => go('/points')} />
            <Stat value={stats?.rank ? `#${stats.rank}` : '–'} label="Rank" onPress={() => go('/(tabs)/leaderboard')} />
          </View>
        </View>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.cls}>{[student.class_label, student.school?.name].filter(Boolean).join(' · ')}</Text>
        {student.bio ? <Text style={styles.bio}>{student.bio}</Text> : null}
        {student.interests?.length ? (
          <View style={styles.interests}>
            {student.interests.map((i) => (
              <Chip key={i} label={i} style={styles.interest} />
            ))}
          </View>
        ) : null}
        <View style={styles.season}>
          <Text style={styles.seasonText}>
            {compactNumber(stats?.points_season ?? 0)} pts this season · {stats?.verified_activities ?? 0} verified · {stats?.badges ?? 0} badges
          </Text>
        </View>
        <View style={styles.actions}>
          <Button label="Edit profile" icon="create-outline" variant="outline" size="sm" full onPress={() => go('/profile-edit')} style={styles.flex} />
          <Button label="My submissions" icon="document-text-outline" variant="secondary" size="sm" full onPress={() => go('/submissions')} style={styles.flex} />
        </View>
      </View>

      {portfolioOn && earned.length > 0 ? (
        <View style={styles.block}>
          <SectionTitle title="Badges" action="See all" onAction={() => go('/achievements')} style={styles.pad} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges}>
            {earned.map((b) => (
              <Touchable key={b.id} onPress={() => go(`/achievements/${b.id}`)} accessibilityLabel={`${b.name} badge`} style={styles.badge}>
                <BadgeIcon icon={b.icon} colour={b.colour} size={52} />
                <Text style={styles.badgeName} numberOfLines={2}>
                  {b.name}
                </Text>
              </Touchable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.links}>
        <Section>
          <ListRow icon="bookmark-outline" title="Saved posts" onPress={() => go('/saved')} />
          <ListRow icon="star-outline" title="Points & history" onPress={() => go('/points')} last={!portfolioOn && !goalsOn && !rewardsOn} />
          {portfolioOn ? <ListRow icon="ribbon-outline" title="Achievements & portfolio" onPress={() => go('/achievements')} last={!goalsOn && !rewardsOn} /> : null}
          {goalsOn ? <ListRow icon="flag-outline" title="My goals" onPress={() => go('/goals')} last={!rewardsOn} /> : null}
          {rewardsOn ? <ListRow icon="gift-outline" title="Rewards" onPress={() => go('/rewards')} last /> : null}
        </Section>
      </View>

      <View style={styles.gridHead}>
        <Text style={styles.gridTitle}>Posts</Text>
      </View>
    </View>
  ) : undefined;

  return (
    <Screen>
      <Header
        title={student?.display_name ?? 'Profile'}
        large
        back={false}
        right={
          <>
            <IconButton icon="add-circle-outline" label="Create activity" onPress={() => go('/(tabs)/create')} />
            <IconButton icon="settings-outline" label="Settings" onPress={() => go('/settings')} />
          </>
        }
      />
      {!student ? (
        <ErrorState error={new Error('Your profile could not be loaded.')} onRetry={() => refreshMe().catch(() => undefined)} />
      ) : (
        <FlatList
          key={`grid-${columns}`}
          data={posts.items}
          numColumns={columns}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => <PostTile post={item} size={tile} />}
          columnWrapperStyle={columns > 1 ? styles.row : undefined}
          ListHeaderComponent={header}
          ListEmptyComponent={
            posts.loading ? (
              <GridSkeleton columns={columns} rows={2} gap={GAP} />
            ) : posts.error ? (
              <ErrorState error={posts.error} onRetry={posts.reload} compact />
            ) : (
              <EmptyState
                art="football"
                title="No posts yet"
                message="Share an activity. Once it is approved it shows here."
                actionLabel="Create activity"
                onAction={() => go('/(tabs)/create')}
                compact
              />
            )
          }
          ListFooterComponent={<ListFooter loading={posts.loadingMore} error={posts.moreError} onRetry={posts.loadMore} />}
          onEndReached={posts.loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={contentWidth}
          refreshControl={<RefreshControl refreshing={posts.refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: ScreenPadding },
  hero: { backgroundColor: Colors.surface, paddingHorizontal: ScreenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.xs },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.sm },
  stats: { flex: 1, flexDirection: 'row' },
  name: { ...Type.subheading, color: Colors.ink },
  cls: { ...Type.small, color: Colors.muted },
  bio: { ...Type.body, color: Colors.body, marginTop: Spacing.xs },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2, marginTop: Spacing.sm },
  interest: { height: 30, paddingHorizontal: Spacing.md },
  season: { marginTop: Spacing.sm },
  seasonText: { ...Type.caption, color: Colors.muted },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  block: { backgroundColor: Colors.surface, marginTop: Spacing.sm, paddingVertical: Spacing.md },
  badges: { paddingHorizontal: ScreenPadding, gap: Spacing.md, paddingTop: Spacing.sm },
  badge: { width: 72, alignItems: 'center', gap: Spacing.xs, minHeight: 44 },
  badgeName: { ...Type.caption, color: Colors.body, textAlign: 'center' },
  links: { padding: ScreenPadding },
  gridHead: {
    backgroundColor: Colors.surface,
    paddingHorizontal: ScreenPadding,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
  gridTitle: { ...Type.subheading, color: Colors.ink },
  row: { gap: GAP, marginBottom: GAP },
});
