import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { challengesApi } from '@/api';
import { ChallengeCard } from '@/components/modules/ChallengeCard';
import { CardSkeleton, EmptyState, ErrorState, FeatureOff, Header, Screen, SegmentedTabs, wideWidth } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { useQuery } from '@/hooks/useQuery';
import { useFeature } from '@/stores/session';
import { Colors, ScreenPadding, Spacing } from '@/theme';
import type { ChallengeTab } from '@/types';

const TABS: { key: ChallengeTab; label: string }[] = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'mine', label: 'Joined' },
];

const EMPTY: Record<ChallengeTab, { title: string; message: string }> = {
  ongoing: { title: 'No challenges right now', message: 'New challenges for your class will appear here.' },
  upcoming: { title: 'Nothing scheduled yet', message: 'Check back soon for upcoming challenges.' },
  completed: { title: 'No completed challenges', message: 'Challenges you finish, and ones that have ended, show here.' },
  mine: { title: 'You have not joined any', message: 'Join a challenge to track your progress and earn its badge.' },
};

/** Challenges list: GET /challenges?tab= */
export default function ChallengesScreen() {
  const enabled = useFeature('challenges');
  const [tab, setTab] = useState<ChallengeTab>('ongoing');
  const { cardColumns, wideWidth: available } = useLayout();
  const q = useQuery(() => challengesApi.list(tab), [tab], { enabled, refetchOnFocus: true });
  const columns = cardColumns(320, 3);
  const cellWidth = columns > 1 ? (available - ScreenPadding * 2 - Spacing.md * (columns - 1)) / columns : undefined;

  return (
    <Screen>
      <Header wide title="Challenges" subtitle="Earn badges for trying new things" />
      {!enabled ? (
        <FeatureOff name="Challenges" />
      ) : (
        <>
          <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
          {q.loading ? (
            <CardSkeleton count={3} height={220} />
          ) : q.error && !q.data ? (
            <ErrorState error={q.error} onRetry={q.reload} feature="Challenges" />
          ) : (
            <FlatList
              key={columns}
              data={q.data ?? []}
              numColumns={columns}
              keyExtractor={(c) => String(c.id)}
              renderItem={({ item }) => (
                <View style={columns > 1 ? { width: cellWidth } : styles.full}>
                  <ChallengeCard challenge={item} />
                </View>
              )}
              columnWrapperStyle={columns > 1 ? styles.columns : undefined}
              contentContainerStyle={[styles.list, wideWidth]}
              ListEmptyComponent={<EmptyState art="running" title={EMPTY[tab].title} message={EMPTY[tab].message} />}
              refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: ScreenPadding, gap: Spacing.md },
  columns: { gap: Spacing.md },
  full: { width: '100%' },
});
