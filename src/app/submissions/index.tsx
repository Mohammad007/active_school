import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { activitiesApi } from '@/api';
import {
  ChipBar,
  contentWidth,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  ListFooter,
  ListSkeleton,
  Pill,
  Screen,
  submissionLabel,
  submissionTone,
  Touchable,
} from '@/components/ui';
import { usePaged } from '@/hooks/usePaged';
import { formatDate } from '@/lib/format';
import { go } from '@/lib/nav';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { Activity, SubmissionFilter } from '@/types';

const TABS: { key: SubmissionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'pending', label: 'In review' },
  { key: 'verified', label: 'Verified' },
  { key: 'changes_requested', label: 'Changes requested' },
  { key: 'rejected', label: 'Rejected' },
];

const EMPTY: Record<SubmissionFilter, { title: string; message: string }> = {
  all: { title: 'No activities yet', message: 'Share a sport, project or event you took part in. Verified activities earn points.' },
  draft: { title: 'No drafts', message: 'Drafts you save appear here until you submit them.' },
  pending: { title: 'Nothing in review', message: 'Submitted activities wait here until a reviewer publishes and verifies them.' },
  verified: { title: 'No verified activities yet', message: 'Once a reviewer verifies an activity, its points are credited.' },
  changes_requested: { title: 'No changes requested', message: 'If a reviewer asks for changes, you will find the activity here.' },
  rejected: { title: 'Nothing rejected', message: 'Rejected or removed activities appear here with the reason.' },
};

/** My activities by status (GET /activities?status=). */
export default function SubmissionsScreen() {
  const [tab, setTab] = useState<SubmissionFilter>('all');
  const list = usePaged((p) => activitiesApi.list(tab, p.page), [tab], { refetchOnFocus: true });

  return (
    <Screen>
      <Header title="My submissions" right={<IconButton icon="add" label="New activity" onPress={() => go('/(tabs)/create')} />} />
      <View style={styles.bar}>
        <ChipBar options={TABS} value={tab} onChange={setTab} />
      </View>
      {list.loading ? (
        <ListSkeleton rows={6} />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => <SubmissionRow activity={item} />}
          contentContainerStyle={[styles.list, contentWidth]}
          ItemSeparatorComponent={Separator}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              art="football"
              title={EMPTY[tab].title}
              message={EMPTY[tab].message}
              actionLabel={tab === 'all' || tab === 'draft' ? 'Create activity' : undefined}
              onAction={() => go('/(tabs)/create')}
            />
          }
          ListFooterComponent={<ListFooter loading={list.loadingMore} error={list.moreError} onRetry={list.loadMore} />}
        />
      )}
    </Screen>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

function SubmissionRow({ activity: a }: { activity: Activity }) {
  const { tone, icon } = submissionTone(a.content_status, a.verified);
  const label = submissionLabel(a.content_status, a.content_status_label, a.verified);
  const photo = a.photos[0];
  const pts = a.verified && a.points != null ? `${a.points} pts` : a.expected_points ? `${a.expected_points} pts if verified` : null;
  return (
    <Touchable onPress={() => go(`/submissions/${a.id}`)} scaleTo={0.985} style={styles.row} accessibilityLabel={`${a.title}, ${label}`}>
      {photo ? (
        <Image source={{ uri: photo.thumb_url }} style={styles.thumb} contentFit="cover" transition={120} />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Ionicons name="image-outline" size={20} color={Colors.subtle} />
        </View>
      )}
      <View style={styles.rowBody}>
        <Text style={styles.title} numberOfLines={1}>
          {a.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[a.category?.name, a.level_label, formatDate(a.occurred_on)].filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.pills}>
          <Pill label={label} tone={tone} icon={icon} />
          {pts ? <Text style={[styles.points, a.verified && styles.pointsOn]}>{pts}</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.subtle} />
    </Touchable>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: Colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  list: { padding: ScreenPadding, flexGrow: 1 },
  sep: { height: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  thumb: { width: 64, height: 64, borderRadius: Radius.md, backgroundColor: Colors.skeleton },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 3 },
  title: { ...Type.subheading, color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted },
  pills: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2, flexWrap: 'wrap' },
  points: { ...Type.caption, color: Colors.muted, fontWeight: '600' },
  pointsOn: { color: Colors.success },
});
