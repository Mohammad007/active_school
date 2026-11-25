import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { challengesApi, eventsApi, socialApi } from '@/api';
import { BannerCarousel } from '@/components/feed/BannerCarousel';
import { ChallengeMiniCard, DiscoverTile, EventMiniCard } from '@/components/feed/ExploreCards';
import { EmptyState, ErrorState, Header, Screen, SectionTitle, Skeleton, Touchable, wideWidth } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { useQuery } from '@/hooks/useQuery';
import type { IconName } from '@/lib/icons';
import { go } from '@/lib/nav';
import { useFeature } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';

/** Explore: banners, ongoing challenges, upcoming events and module shortcuts. */
export default function ExploreScreen() {
  const { wideWidth: cw, columns, isTablet } = useLayout();
  const challengesOn = useFeature('challenges');
  const eventsOn = useFeature('events');
  const portfolioOn = useFeature('portfolio');
  const goalsOn = useFeature('goals');
  const rewardsOn = useFeature('rewards');
  const [refreshing, setRefreshing] = useState(false);

  const banners = useQuery(() => socialApi.banners('explore'), []);
  const challenges = useQuery(() => challengesApi.list('ongoing'), [], { enabled: challengesOn, refetchOnFocus: true });
  const events = useQuery(async () => (await eventsApi.list('upcoming', 1)).data, [], { enabled: eventsOn, refetchOnFocus: true });
  const discover = useQuery(async () => (await socialApi.feed({ per_page: 8 })).data, [], { refetchOnFocus: true });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([banners.reload(), discover.reload(), challengesOn ? challenges.reload() : null, eventsOn ? events.reload() : null]);
    setRefreshing(false);
  }, [banners, challenges, discover, events, challengesOn, eventsOn]);

  const links: { key: string; title: string; subtitle: string; icon: IconName; path: string }[] = [
    ...(portfolioOn ? [{ key: 'ach', title: 'Achievements', subtitle: 'Badges & certificates', icon: 'ribbon-outline' as IconName, path: '/achievements' }] : []),
    ...(goalsOn ? [{ key: 'goals', title: 'Goals', subtitle: 'Weekly & monthly', icon: 'flag-outline' as IconName, path: '/goals' }] : []),
    ...(rewardsOn ? [{ key: 'rewards', title: 'Rewards', subtitle: 'Top 3 prizes', icon: 'gift-outline' as IconName, path: '/rewards' }] : []),
    { key: 'ranks', title: 'Leaderboard', subtitle: 'Your class ranking', icon: 'podium-outline', path: '/(tabs)/leaderboard' },
    { key: 'points', title: 'My points', subtitle: 'History & pending', icon: 'star-outline', path: '/points' },
  ];
  const cols = columns(150, 2, 4, cw - ScreenPadding * 2);
  const tileWidth = (cw - ScreenPadding * 2 - Spacing.sm * (cols - 1)) / cols;
  const challengeWidth = Math.min(280, cw * 0.66);
  const discoverCols = columns(170, 2, 4, cw - ScreenPadding * 2);
  const discoverWidth = (cw - ScreenPadding * 2 - Spacing.md * (discoverCols - 1)) / discoverCols;
  const eventWidth = isTablet ? (cw - ScreenPadding * 2 - Spacing.sm) / 2 : undefined;
  const nothingOn = !challengesOn && !eventsOn && !banners.data?.length && !banners.loading;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Header back={false} large wide title="Explore" />
      <ScrollView
        contentContainerStyle={[wideWidth, styles.content]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
        <BannerCarousel banners={banners.data} loading={banners.loading} />

        {challengesOn ? (
          <View style={styles.section}>
            <SectionTitle title="Challenges" action="See all" onAction={() => go('/challenges')} style={styles.pad} />
            {challenges.loading ? (
              <View style={[styles.row, styles.pad]}>
                <Skeleton width={challengeWidth} height={170} radius={Radius.lg} />
                <Skeleton width={challengeWidth} height={170} radius={Radius.lg} />
              </View>
            ) : challenges.error ? (
              <ErrorState error={challenges.error} onRetry={challenges.reload} compact feature="Challenges" />
            ) : challenges.data?.length ? (
              <FlatList
                horizontal
                data={challenges.data}
                keyExtractor={(c) => String(c.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
                renderItem={({ item }) => <ChallengeMiniCard challenge={item} width={challengeWidth} />}
              />
            ) : (
              <EmptyState compact art="running" title="No live challenges" message="New challenges appear here when your school starts them." />
            )}
          </View>
        ) : null}

        {eventsOn ? (
          <View style={styles.section}>
            <SectionTitle title="Upcoming events" action="See all" onAction={() => go('/events')} style={styles.pad} />
            <View style={[styles.pad, isTablet ? styles.grid : styles.stack]}>
              {events.loading ? (
                <>
                  <Skeleton height={84} radius={Radius.lg} />
                  <Skeleton height={84} radius={Radius.lg} />
                </>
              ) : events.error ? (
                <ErrorState error={events.error} onRetry={events.reload} compact feature="Events" />
              ) : events.data?.length ? (
                events.data.slice(0, 4).map((e) => (
                  <View key={e.id} style={eventWidth ? { width: eventWidth } : undefined}>
                    <EventMiniCard event={e} />
                  </View>
                ))
              ) : (
                <EmptyState compact art="basketball" title="No upcoming events" message="Check back soon for competitions near you." />
              )}
            </View>
          </View>
        ) : null}

        {discover.data?.length ? (
          <View style={styles.section}>
            <SectionTitle title="Discover" action="See feed" onAction={() => go('/(tabs)/home')} style={styles.pad} />
            <View style={[styles.grid, styles.pad, styles.discover]}>
              {discover.data.map((p) => (
                <DiscoverTile key={p.id} post={p} width={discoverWidth} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionTitle title="More" style={styles.pad} />
          <View style={[styles.grid, styles.pad]}>
            {links.map((l) => (
              <Touchable key={l.key} onPress={() => go(l.path)} accessibilityLabel={`${l.title}, ${l.subtitle}`} style={[styles.tile, { width: tileWidth }]}>
                <View style={styles.tileIcon}>
                  <Ionicons name={l.icon} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.tileTitle} numberOfLines={1}>
                  {l.title}
                </Text>
                <Text style={styles.tileSub} numberOfLines={1}>
                  {l.subtitle}
                </Text>
              </Touchable>
            ))}
          </View>
        </View>

        {nothingOn ? (
          <EmptyState icon="lock-closed-outline" title="Challenges and events are not available" message="Your school has not switched these features on yet." />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xxl },
  pad: { paddingHorizontal: ScreenPadding },
  section: { marginTop: Spacing.xl, gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md },
  rail: { paddingHorizontal: ScreenPadding, gap: Spacing.md },
  stack: { gap: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  discover: { gap: Spacing.md },
  tile: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    gap: Spacing.xs,
    minHeight: 96,
  },
  tileIcon: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  tileTitle: { ...Type.subheading, color: Colors.ink },
  tileSub: { ...Type.caption, color: Colors.muted },
});
