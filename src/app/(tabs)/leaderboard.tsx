import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { competitionApi } from '@/api';
import { MEDALS, openStudent, Podium } from '@/components/competition/Podium';
import { ScoringRulesSheet } from '@/components/competition/ScoringRulesSheet';
import {
  Avatar,
  ChipBar,
  contentWidth,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  ListSkeleton,
  Notice,
  Pill,
  ProgressBar,
  Screen,
  Skeleton,
  Toggle,
  Touchable,
} from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { compactNumber, formatDate, ordinal } from '@/lib/format';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { Leaderboard, LeaderboardEntry } from '@/types';

type Period = 'season' | 'all_time';

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<Period>('season');
  const [seasonId, setSeasonId] = useState<number>(0);
  const [rulesOpen, setRulesOpen] = useState(false);

  const seasons = useQuery(() => competitionApi.seasons(), []);
  const board = useQuery(
    () => competitionApi.leaderboard({ period, season_id: period === 'season' && seasonId ? seasonId : null }),
    [period, seasonId],
    { refetchOnFocus: true },
  );

  const data = board.data;
  const entries = data?.entries ?? [];
  const rest = entries.slice(3);

  const seasonOptions = [
    { key: 0, label: 'Current' },
    ...(seasons.data ?? []).map((s) => ({ key: s.id, label: s.name })),
  ];

  const header = (
    <View style={styles.headerBlock}>
      <Toggle
        options={[
          { key: 'season', label: 'Season' },
          { key: 'all_time', label: 'All time' },
        ]}
        value={period}
        onChange={setPeriod}
        style={styles.toggle}
      />
      {period === 'season' && (seasons.data?.length ?? 0) > 0 ? (
        <ChipBar options={seasonOptions} value={seasonId} onChange={setSeasonId} style={styles.chips} />
      ) : null}
      {data ? <BoardMeta data={data} /> : null}
      {data && entries.length > 0 ? <Podium entries={entries.slice(0, 3)} /> : null}
      {rest.length > 0 ? <Text style={styles.listTitle}>Rankings</Text> : null}
    </View>
  );

  const renderBody = () => {
    if (board.loading) {
      return (
        <View style={contentWidth}>
          <View style={styles.skelTop}>
            <Skeleton height={40} radius={Radius.md} />
            <Skeleton height={140} radius={Radius.lg} />
          </View>
          <ListSkeleton rows={6} />
        </View>
      );
    }
    if (board.error && !data) return <ErrorState error={board.error} onRetry={board.reload} />;
    return (
      <FlatList
        data={rest}
        keyExtractor={(e, i) => `${e.rank}-${e.student.id ?? `h${i}`}`}
        renderItem={({ item }) => <Row entry={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          entries.length === 0 ? (
            <EmptyState
              art="running"
              title="No rankings yet"
              message="Ranks appear once activities are verified. Post your activities to get on the board."
            />
          ) : undefined
        }
        contentContainerStyle={[contentWidth, styles.list]}
        refreshControl={<RefreshControl refreshing={board.refreshing} onRefresh={board.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <Screen>
      <Header
        title="Leaderboard"
        large
        back={false}
        right={<IconButton icon="help-circle-outline" label="How points work" onPress={() => setRulesOpen(true)} />}
      />
      <View style={styles.flex}>{renderBody()}</View>
      {data ? <MyRank data={data} /> : null}
      <ScoringRulesSheet visible={rulesOpen} onClose={() => setRulesOpen(false)} />
    </Screen>
  );
}

function BoardMeta({ data }: { data: Leaderboard }) {
  const final = data.status === 'final';
  return (
    <View style={styles.meta}>
      <View style={styles.metaRow}>
        <View style={styles.flex}>
          <Text style={styles.scope} numberOfLines={2}>
            {data.scope_label}
          </Text>
          <Text style={styles.season}>
            {data.period === 'all_time'
              ? 'All-time points · informational'
              : data.season
                ? `${data.season.name} · ${formatDate(data.season.starts_on, false)} – ${formatDate(data.season.ends_on)}`
                : 'No active season'}
          </Text>
        </View>
        {final ? <Pill label="Final" tone="success" icon="checkmark-circle" /> : <Pill label="Provisional" tone="warning" icon="time-outline" />}
      </View>
      {!final ? <Notice tone="warning" message="Ranks can change until the season is finalised." /> : null}
    </View>
  );
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  const s = entry.student;
  const tappable = !!s.id;
  return (
    <Touchable
      disabled={!tappable}
      onPress={() => openStudent(s)}
      scaleTo={0.99}
      accessibilityLabel={`Rank ${entry.rank}, ${s.is_me ? 'you' : s.display_name}, ${entry.points} points${entry.eligible ? '' : ', not yet eligible'}`}
      style={[styles.row, s.is_me && styles.rowMe]}>
      <Text style={styles.rank}>{entry.rank}</Text>
      <Avatar uri={s.avatar_url} name={s.display_name} size={40} />
      <View style={styles.flex}>
        <Text style={styles.name} numberOfLines={1}>
          {s.is_me ? `${s.display_name} (you)` : s.display_name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {[s.class_label, `${entry.verified_activities} verified`].filter(Boolean).join(' · ')}
          {!entry.eligible ? ' · not eligible yet' : ''}
        </Text>
      </View>
      <View style={styles.pointsCol}>
        <Text style={styles.points}>{compactNumber(entry.points)}</Text>
        <Text style={styles.pts}>pts</Text>
      </View>
    </Touchable>
  );
}

function MyRank({ data }: { data: Leaderboard }) {
  const me = data.me;
  const medal = me.rank && me.rank <= 3 ? MEDALS[me.rank as 1 | 2 | 3] : null;
  const progress = me.min_activities ? Math.min(1, me.verified_activities / me.min_activities) : 1;
  return (
    <View style={styles.mine}>
      <View style={[styles.mineInner, contentWidth]}>
        <View style={[styles.mineRank, medal && { backgroundColor: medal.tint }]}>
          {me.rank ? (
            <Text style={[styles.mineRankText, medal && { color: medal.colour }]}>{ordinal(me.rank)}</Text>
          ) : (
            <Ionicons name="remove" size={18} color={Colors.muted} />
          )}
        </View>
        <View style={styles.flex}>
          <Text style={styles.mineTitle}>{me.rank ? 'Your rank' : 'Not ranked yet'}</Text>
          {me.eligible ? (
            <Text style={styles.sub}>{me.verified_activities} verified activities · eligible</Text>
          ) : (
            <View style={styles.eligibility}>
              <Text style={styles.sub}>
                {me.verified_activities}/{me.min_activities} verified activities to qualify
              </Text>
              <ProgressBar value={progress} colour={Colors.accent} height={4} />
            </View>
          )}
        </View>
        <View style={styles.pointsCol}>
          <Text style={styles.points}>{compactNumber(me.points)}</Text>
          <Text style={styles.pts}>pts</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingBottom: Spacing.xl },
  headerBlock: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.md, gap: Spacing.sm },
  toggle: { marginBottom: Spacing.xs },
  chips: { marginHorizontal: -ScreenPadding },
  skelTop: { padding: ScreenPadding, gap: Spacing.md },
  meta: { gap: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  scope: { ...Type.subheading, color: Colors.ink },
  season: { ...Type.caption, color: Colors.muted, marginTop: 2 },
  listTitle: { ...Type.caption, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 60,
    paddingHorizontal: ScreenPadding,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
    backgroundColor: Colors.surface,
  },
  rowMe: { backgroundColor: Colors.primaryTint },
  rank: { ...Type.subheading, color: Colors.muted, width: 28, textAlign: 'center' },
  name: { ...Type.body, fontWeight: '600', color: Colors.ink },
  sub: { ...Type.caption, color: Colors.muted },
  pointsCol: { alignItems: 'flex-end' },
  points: { ...Type.subheading, color: Colors.ink },
  pts: { ...Type.micro, color: Colors.muted },
  mine: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
  mineInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: ScreenPadding, paddingVertical: Spacing.md },
  mineRank: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  mineRankText: { ...Type.small, fontWeight: '700', color: Colors.primary },
  mineTitle: { ...Type.body, fontWeight: '600', color: Colors.ink },
  eligibility: { gap: Spacing.xs, marginTop: 2, maxWidth: 220 },
});
