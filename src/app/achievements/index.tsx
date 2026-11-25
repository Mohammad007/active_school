import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { achievementsApi } from '@/api';
import { BadgeIcon } from '@/components/profile/BadgeIcon';
import {
  Card,
  CardSkeleton,
  ChipBar,
  contentWidth,
  EmptyState,
  ErrorState,
  FeatureOff,
  Header,
  ListFooter,
  Pill,
  ProgressBar,
  Screen,
  SegmentedTabs,
  Touchable,
} from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { usePaged } from '@/hooks/usePaged';
import { useQuery } from '@/hooks/useQuery';
import { formatDate } from '@/lib/format';
import { go } from '@/lib/nav';
import { useFeature, useSession } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { Achievement, Activity } from '@/types';

type Tab = 'badges' | 'portfolio';
type Filter = 'all' | 'earned' | 'locked';

export default function AchievementsScreen() {
  const enabled = useFeature('portfolio');
  const [tab, setTab] = useState<Tab>('badges');
  return (
    <Screen>
      <Header title="Achievements" />
      {!enabled ? (
        <FeatureOff name="Achievements" />
      ) : (
        <>
          <SegmentedTabs
            tabs={[
              { key: 'badges', label: 'Badges' },
              { key: 'portfolio', label: 'Portfolio' },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === 'badges' ? <Badges /> : <Portfolio />}
        </>
      )}
    </Screen>
  );
}

function bucketLabel(b: string | null) {
  if (!b) return 'Other';
  return b.charAt(0).toUpperCase() + b.slice(1).replace(/_/g, ' ');
}

function Badges() {
  const [filter, setFilter] = useState<Filter>('all');
  const { contentWidth: width, columns } = useLayout();
  const q = useQuery(() => achievementsApi.list(), [], { refetchOnFocus: true });
  const list = q.data ?? [];
  const earned = list.filter((b) => b.earned).length;
  const cols = columns(110, 3, 6, width - ScreenPadding * 2);
  const tile = Math.floor((width - ScreenPadding * 2 - Spacing.sm * (cols - 1)) / cols);

  const shown = list.filter((b) => (filter === 'all' ? true : filter === 'earned' ? b.earned : !b.earned));
  const groups = shown.reduce<Record<string, Achievement[]>>((acc, b) => {
    const k = bucketLabel(b.bucket);
    (acc[k] ??= []).push(b);
    return acc;
  }, {});

  if (q.loading) return <CardSkeleton count={3} height={110} />;
  if (q.error && !q.data) return <ErrorState error={q.error} onRetry={q.reload} feature="Achievements" />;

  return (
    <ScrollView
      contentContainerStyle={[contentWidth, styles.content]}
      refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      showsVerticalScrollIndicator={false}>
      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>
            {earned}
            <Text style={styles.summaryOf}> / {list.length}</Text>
          </Text>
          <Text style={styles.summaryLabel}>badges earned</Text>
        </View>
        <ProgressBar value={list.length ? earned / list.length : 0} />
      </Card>
      <ChipBar
        options={[
          { key: 'all', label: 'All' },
          { key: 'earned', label: 'Earned' },
          { key: 'locked', label: 'Locked' },
        ]}
        value={filter}
        onChange={setFilter}
        style={styles.chips}
      />
      {!shown.length ? (
        <EmptyState
          art="basketball"
          title={filter === 'earned' ? 'No badges yet' : 'Nothing here'}
          message={filter === 'earned' ? 'Complete challenges and get activities verified to earn badges.' : 'No badges match this filter.'}
          compact
        />
      ) : (
        Object.entries(groups).map(([group, badges]) => (
          <View key={group} style={styles.group}>
            <Text style={styles.groupTitle}>{group}</Text>
            <View style={styles.grid}>
              {badges.map((b) => (
                <Touchable
                  key={b.id}
                  onPress={() => go(`/achievements/${b.id}`)}
                  accessibilityLabel={`${b.name}, ${b.earned ? 'earned' : 'locked'}`}
                  style={[styles.tile, { width: tile }]}>
                  <BadgeIcon icon={b.icon} colour={b.colour} size={Math.min(64, tile * 0.6)} locked={!b.earned} />
                  <Text style={[styles.tileName, !b.earned && styles.locked]} numberOfLines={2}>
                    {b.name}
                  </Text>
                  {b.earned && b.earned_at ? <Text style={styles.tileDate}>{formatDate(b.earned_at, false)}</Text> : null}
                </Touchable>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const LEVEL_OPTIONS = [
  { key: '', label: 'All levels' },
  { key: 'local', label: 'Local' },
  { key: 'district', label: 'District' },
  { key: 'state', label: 'State' },
  { key: 'national', label: 'National' },
];

function Portfolio() {
  const levels = useSession((s) => s.config?.levels);
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(0);
  const [level, setLevel] = useState<string>('');
  const list = usePaged(
    (p) => achievementsApi.portfolio(p.page, { year: year || null, level: level || null }),
    [year, level],
  );

  const yearOptions = [{ key: 0, label: 'All years' }, ...[0, 1, 2].map((i) => ({ key: thisYear - i, label: String(thisYear - i) }))];
  const levelOptions = LEVEL_OPTIONS.map((o) => (o.key && levels?.[o.key as keyof typeof levels] ? { ...o, label: levels[o.key as keyof typeof levels] } : o));

  return (
    <FlatList
      data={list.items}
      keyExtractor={(a) => String(a.id)}
      renderItem={({ item }) => <PortfolioRow activity={item} />}
      ListHeaderComponent={
        <View style={styles.filters}>
          <ChipBar options={yearOptions} value={year} onChange={setYear} />
          <ChipBar options={levelOptions} value={level} onChange={setLevel} />
        </View>
      }
      ListEmptyComponent={
        list.loading ? (
          <CardSkeleton count={3} height={72} />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} feature="Portfolio" compact />
        ) : (
          <EmptyState icon="albums-outline" title="No verified activities" message="Activities appear in your portfolio once a reviewer verifies them." compact />
        )
      }
      ListFooterComponent={<ListFooter loading={list.loadingMore} error={list.moreError} onRetry={list.loadMore} />}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.4}
      contentContainerStyle={contentWidth}
      refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
    />
  );
}

function PortfolioRow({ activity: a }: { activity: Activity }) {
  return (
    <Touchable onPress={() => go(`/submissions/${a.id}`)} scaleTo={0.99} accessibilityLabel={`${a.title}, ${a.level_label}, ${a.result_label}`} style={styles.pRow}>
      <View style={styles.pDate}>
        <Text style={styles.pDay}>{a.occurred_on ? formatDate(a.occurred_on, false) : ''}</Text>
        <Text style={styles.pYear}>{a.occurred_on?.slice(0, 4)}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.pTitle} numberOfLines={1}>
          {a.title}
        </Text>
        <View style={styles.pTags}>
          {a.category ? <Pill label={a.category.name} colour={a.category.colour} /> : null}
          <Pill label={a.level_label} tone="info" />
          {a.result !== 'participation' ? <Pill label={a.result_label} tone="accent" icon="trophy" /> : null}
        </View>
      </View>
      {a.points ? <Text style={styles.pPoints}>+{a.points}</Text> : null}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.md, paddingBottom: Spacing.xxl },
  summary: { gap: Spacing.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  summaryValue: { ...Type.display, color: Colors.ink },
  summaryOf: { ...Type.body, color: Colors.muted },
  summaryLabel: { ...Type.body, color: Colors.muted },
  chips: { marginHorizontal: -ScreenPadding },
  group: { gap: Spacing.sm },
  groupTitle: { ...Type.caption, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  tileName: { ...Type.caption, fontWeight: '600', color: Colors.ink, textAlign: 'center' },
  locked: { color: Colors.muted },
  tileDate: { ...Type.micro, color: Colors.subtle },
  filters: { paddingTop: Spacing.xs },
  pRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: ScreenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
    minHeight: 64,
  },
  pDate: { width: 52, alignItems: 'center' },
  pDay: { ...Type.small, fontWeight: '600', color: Colors.ink },
  pYear: { ...Type.caption, color: Colors.muted },
  pTitle: { ...Type.body, fontWeight: '600', color: Colors.ink },
  pTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  pPoints: { ...Type.subheading, color: Colors.success },
});
