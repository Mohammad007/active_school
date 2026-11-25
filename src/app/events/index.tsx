import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { eventsApi } from '@/api';
import { EventCard } from '@/components/modules/EventCard';
import { CardSkeleton, ChipBar, EmptyState, ErrorState, FeatureOff, Header, ListFooter, Screen, SegmentedTabs, wideWidth } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { usePaged } from '@/hooks/usePaged';
import { useFeature, useSession } from '@/stores/session';
import { Colors, ScreenPadding, Spacing } from '@/theme';
import type { EventTab } from '@/types';

const TABS: { key: EventTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Past' },
  { key: 'mine', label: 'My events' },
];

type MonthKey = 'any' | 'this' | 'next';

function monthParam(key: MonthKey): string | null {
  if (key === 'any') return null;
  const d = new Date();
  if (key === 'next') d.setMonth(d.getMonth() + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const EMPTY: Record<EventTab, { title: string; message: string }> = {
  upcoming: { title: 'No upcoming events', message: 'School-approved events and competitions will show up here.' },
  completed: { title: 'No past events', message: 'Events that have finished appear here with their results.' },
  mine: { title: 'No registrations yet', message: 'Events you register for will appear here.' },
};

/** Events calendar: GET /events?tab=&category=&month= (paginated). */
export default function EventsScreen() {
  const enabled = useFeature('events');
  const categories = useSession((s) => s.categories);
  const [tab, setTab] = useState<EventTab>('upcoming');
  const [category, setCategory] = useState<number>(0);
  const [month, setMonth] = useState<MonthKey>('any');
  const { cardColumns, wideWidth: available } = useLayout();
  const columns = cardColumns(340, 3);
  const cellWidth = columns > 1 ? (available - ScreenPadding * 2 - Spacing.md * (columns - 1)) / columns : undefined;

  const list = usePaged(
    ({ page }) => eventsApi.list(tab, page, { category: category || null, month: monthParam(month) }),
    [tab, category, month],
    { enabled, refetchOnFocus: true },
  );

  const categoryOptions = useMemo(
    () => [{ key: 0, label: 'All' }, ...categories.map((c) => ({ key: c.id, label: c.name, colour: c.colour ?? undefined }))],
    [categories],
  );

  const filters = (
    <View>
      {categories.length ? <ChipBar options={categoryOptions} value={category} onChange={setCategory} /> : null}
      <ChipBar
        options={[
          { key: 'any' as MonthKey, label: 'Any time', icon: 'calendar-outline' as const },
          { key: 'this' as MonthKey, label: 'This month' },
          { key: 'next' as MonthKey, label: 'Next month' },
        ]}
        value={month}
        onChange={setMonth}
        style={styles.monthBar}
      />
    </View>
  );

  return (
    <Screen>
      <Header wide title="Events" subtitle="Competitions and activities near you" />
      {!enabled ? (
        <FeatureOff name="Events" />
      ) : (
        <>
          <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
          {list.loading ? (
            <>
              {filters}
              <CardSkeleton count={4} height={110} />
            </>
          ) : list.error && !list.items.length ? (
            <ErrorState error={list.error} onRetry={list.reload} feature="Events" />
          ) : (
            <FlatList
              key={columns}
              data={list.items}
              numColumns={columns}
              keyExtractor={(e) => String(e.id)}
              ListHeaderComponent={filters}
              ListHeaderComponentStyle={styles.header}
              renderItem={({ item }) => (
                <View style={columns > 1 ? { width: cellWidth } : styles.full}>
                  <EventCard event={item} />
                </View>
              )}
              columnWrapperStyle={columns > 1 ? styles.columns : undefined}
              contentContainerStyle={[styles.list, wideWidth]}
              onEndReached={list.loadMore}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={<EmptyState art="basketball" title={EMPTY[tab].title} message={EMPTY[tab].message} />}
              ListFooterComponent={<ListFooter loading={list.loadingMore} error={list.moreError} onRetry={list.loadMore} />}
              refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: ScreenPadding, paddingBottom: ScreenPadding, gap: Spacing.md },
  header: { marginHorizontal: -ScreenPadding },
  monthBar: { marginTop: -Spacing.sm },
  columns: { gap: Spacing.md },
  full: { width: '100%' },
});
