import { useLocalSearchParams } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { eventsApi } from '@/api';
import { EventLeaderRow, resultsStatusPill } from '@/components/modules/EventLeaderRow';
import { EmptyState, ErrorState, FeatureOff, Header, ListSkeleton, Pill, Screen, contentWidth } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { useFeature } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';

/** Event placements: GET /events/{id}/leaderboard. */
export default function EventLeaderboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enabled = useFeature('events');
  const q = useQuery(() => eventsApi.leaderboard(id), [id], { enabled: enabled && !!id });
  const data = q.data;
  const status = resultsStatusPill(data?.status);

  return (
    <Screen>
      <Header title="Event leaderboard" subtitle={data?.event.title} />
      {!enabled ? (
        <FeatureOff name="Events" />
      ) : q.loading ? (
        <ListSkeleton rows={8} />
      ) : !data ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Events" />
      ) : (
        <FlatList
          data={data.entries}
          keyExtractor={(e) => `${e.rank}-${e.student.id ?? 'x'}`}
          contentContainerStyle={[styles.content, contentWidth]}
          ListHeaderComponent={
            <View style={styles.head}>
              <Pill label={status.label} tone={status.tone} icon={status.icon} />
              <Text style={styles.note}>
                {status.tone === 'success'
                  ? 'Results have been finalised by staff.'
                  : 'Placements can still change while staff review results.'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={[styles.item, index === 0 && styles.first, index === data.entries.length - 1 && styles.lastItem]}>
              <EventLeaderRow entry={item} last={index === data.entries.length - 1} />
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="podium-outline" title="No results yet" message="Placements appear once staff record attendance and results." />}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, paddingBottom: Spacing.xxl },
  head: { gap: Spacing.sm, marginBottom: Spacing.md },
  note: { ...Type.small, color: Colors.muted },
  item: {
    backgroundColor: Colors.surface,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  first: { borderTopWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  lastItem: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg },
});
