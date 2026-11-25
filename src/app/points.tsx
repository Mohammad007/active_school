import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { competitionApi } from '@/api';
import { ScoringRulesSheet } from '@/components/competition/ScoringRulesSheet';
import {
  Card,
  contentWidth,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  ListFooter,
  ListSkeleton,
  Pill,
  Screen,
  Skeleton,
  Touchable,
} from '@/components/ui';
import { usePaged } from '@/hooks/usePaged';
import { compactNumber, formatDate } from '@/lib/format';
import type { IconName } from '@/lib/icons';
import { openRoute } from '@/lib/nav';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { PointsEntry, PointsMeta, PointsSummary } from '@/types';

const TYPE_ICON: Record<string, IconName> = {
  activity: 'images-outline',
  event: 'calendar-outline',
  bonus: 'gift-outline',
  adjustment: 'swap-vertical-outline',
};

export default function PointsScreen() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const ledger = usePaged<PointsEntry, PointsMeta>((p) => competitionApi.points(p.page), [], { refetchOnFocus: true });
  const summary = ledger.meta?.summary;

  return (
    <Screen>
      <Header title="Points" right={<IconButton icon="help-circle-outline" label="How points work" onPress={() => setRulesOpen(true)} />} />
      {ledger.loading ? (
        <View style={contentWidth}>
          <View style={styles.pad}>
            <Skeleton height={150} radius={Radius.lg} />
          </View>
          <ListSkeleton rows={6} />
        </View>
      ) : ledger.error && !ledger.items.length ? (
        <ErrorState error={ledger.error} onRetry={ledger.reload} />
      ) : (
        <FlatList
          data={ledger.items}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item, index }) => <LedgerRow entry={item} last={index === ledger.items.length - 1} />}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              {summary ? <Summary summary={summary} /> : null}
              <Touchable onPress={() => setRulesOpen(true)} style={styles.rulesLink} accessibilityLabel="How points work">
                <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.rulesText}>How points work</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </Touchable>
              {ledger.items.length ? <Text style={styles.section}>History</Text> : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              art="basketball"
              title="No points yet"
              message="Points are credited after a reviewer verifies your activity. Appreciations never affect points."
              compact
            />
          }
          ListFooterComponent={<ListFooter loading={ledger.loadingMore} error={ledger.moreError} onRetry={ledger.loadMore} />}
          onEndReached={ledger.loadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={contentWidth}
          refreshControl={<RefreshControl refreshing={ledger.refreshing} onRefresh={ledger.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
      <ScoringRulesSheet visible={rulesOpen} onClose={() => setRulesOpen(false)} />
    </Screen>
  );
}

function Summary({ summary }: { summary: PointsSummary }) {
  return (
    <Card style={styles.summary}>
      <View style={styles.totals}>
        <View style={styles.coin} importantForAccessibility="no-hide-descendants">
          <View style={styles.coinInner}>
            <Ionicons name="star" size={28} color={Colors.white} />
          </View>
        </View>
        <View style={styles.flex} accessible accessibilityLabel={`${summary.total} total points`}>
          <Text style={styles.total}>{compactNumber(summary.total)}</Text>
          <Text style={styles.label}>Total Points</Text>
        </View>
        <View style={styles.seasonBox}>
          <Text style={styles.seasonValue}>{compactNumber(summary.season)}</Text>
          <Text style={styles.label} numberOfLines={1}>
            {summary.season_name ?? 'This season'}
          </Text>
        </View>
      </View>
      {summary.pending > 0 ? (
        <View style={styles.pending} accessible accessibilityLabel={`${summary.pending} points pending review, not credited yet`}>
          <Ionicons name="hourglass-outline" size={16} color={Colors.warning} />
          <Text style={styles.pendingText}>
            {compactNumber(summary.pending)} pts pending review — not credited yet
          </Text>
        </View>
      ) : null}
      <View style={styles.breakdown}>
        <Breakdown icon="images-outline" label="Activities" value={summary.by_type.activity} />
        <Breakdown icon="calendar-outline" label="Events" value={summary.by_type.event} />
        <Breakdown icon="gift-outline" label="Bonus & adj." value={summary.by_type.bonus} />
      </View>
    </Card>
  );
}

function Breakdown({ icon, label, value }: { icon: IconName; label: string; value: number }) {
  return (
    <View style={styles.bd} accessible accessibilityLabel={`${label}: ${value} points`}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text style={styles.bdValue}>{compactNumber(value)}</Text>
      <Text style={styles.bdLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function LedgerRow({ entry, last }: { entry: PointsEntry; last: boolean }) {
  const positive = entry.points >= 0;
  const tappable = !!entry.route;
  return (
    <Touchable
      disabled={!tappable}
      onPress={() => openRoute(entry.route)}
      scaleTo={0.99}
      accessibilityLabel={`${entry.title}, ${positive ? 'plus' : 'minus'} ${Math.abs(entry.points)} points, ${formatDate(entry.created_at)}`}
      style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <Ionicons name={TYPE_ICON[entry.type] ?? 'star-outline'} size={18} color={Colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {entry.title}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {[entry.reason !== entry.title ? entry.reason : null, formatDate(entry.created_at)].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowPoints, { color: positive ? Colors.success : Colors.danger }]}>
          {positive ? '+' : '−'}
          {Math.abs(entry.points)}
        </Text>
        <Pill label="Credited" tone="success" />
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  coin: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.goldTint, alignItems: 'center', justifyContent: 'center' },
  coinInner: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.accentTint },
  seasonBox: { alignItems: 'flex-end', maxWidth: 140 },
  seasonValue: { ...Type.stat, color: Colors.primary },
  flex: { flex: 1 },
  pad: { padding: ScreenPadding },
  headerBlock: { padding: ScreenPadding, gap: Spacing.md },
  summary: { gap: Spacing.md },
  totals: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  label: { ...Type.caption, color: Colors.muted },
  total: { ...Type.display, fontSize: 28, lineHeight: 34, color: Colors.ink },
  pending: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.warningTint, borderRadius: Radius.md, padding: Spacing.sm + 2 },
  pendingText: { ...Type.small, color: Colors.warning, fontWeight: '600', flex: 1 },
  breakdown: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.hairline, paddingTop: Spacing.md },
  bd: { flex: 1, alignItems: 'center', gap: 2 },
  bdValue: { ...Type.subheading, color: Colors.ink },
  bdLabel: { ...Type.caption, color: Colors.muted },
  rulesLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2, minHeight: 44, alignSelf: 'flex-start' },
  rulesText: { ...Type.small, fontWeight: '600', color: Colors.primary },
  section: { ...Type.caption, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 60, paddingHorizontal: ScreenPadding, paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  rowIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { ...Type.body, fontWeight: '600', color: Colors.ink },
  rowSub: { ...Type.caption, color: Colors.muted, marginTop: 1 },
  rowRight: { alignItems: 'flex-end', gap: 3 },
  rowPoints: { ...Type.subheading },
});
