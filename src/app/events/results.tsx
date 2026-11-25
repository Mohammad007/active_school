import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { eventsApi } from '@/api';
import { useEvent } from '@/components/modules/EventCard';
import { EventLeaderRow, resultsStatusPill } from '@/components/modules/EventLeaderRow';
import { Button, Card, CardSkeleton, ErrorState, FeatureOff, Header, Notice, Pill, Screen, SectionTitle, contentWidth } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { go } from '@/lib/nav';
import { useFeature, useSession } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';

/** My result for an event + the podium (GET /events/{id} and /events/{id}/leaderboard). */
export default function EventResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enabled = useFeature('events');
  const results = useSession((s) => s.config?.results);
  const q = useEvent(enabled ? id : undefined);
  const board = useQuery(() => eventsApi.leaderboard(id), [id], { enabled: enabled && !!id });
  const e = q.data;
  const reg = e?.registration;
  const status = resultsStatusPill(board.data?.status ?? e?.results_status);
  const top = (board.data?.entries ?? []).slice(0, 3);
  const points = reg?.result ? e?.points?.[reg.result] : undefined;

  const refresh = async () => {
    await Promise.all([q.refresh(), board.refresh()]);
  };

  return (
    <Screen>
      <Header title="Results" subtitle={e?.title} />
      {!enabled ? (
        <FeatureOff name="Events" />
      ) : q.loading ? (
        <CardSkeleton count={2} height={160} />
      ) : !e ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Events" />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, contentWidth]}
          refreshControl={<RefreshControl refreshing={q.refreshing || board.refreshing} onRefresh={refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
          <Pill label={status.label} tone={status.tone} icon={status.icon} />

          <Card style={styles.mine}>
            <View style={styles.trophy}>
              <Ionicons name={reg?.result && reg.result !== 'participation' ? 'trophy' : 'ribbon'} size={26} color={Colors.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Your result</Text>
              {!reg || reg.status === 'cancelled' ? (
                <Text style={styles.value}>You did not register for this event</Text>
              ) : reg.status !== 'attended' ? (
                <Text style={styles.value}>{reg.status === 'absent' ? 'Marked absent' : 'Attendance not confirmed yet'}</Text>
              ) : reg.result ? (
                <>
                  <Text style={styles.value}>{results?.[reg.result] ?? reg.result}</Text>
                  <Text style={styles.muted}>
                    {points !== undefined ? `${points} pts · ` : ''}
                    {reg.result_verified ? 'Verified' : 'Provisional, under review'}
                  </Text>
                </>
              ) : (
                <Text style={styles.value}>Result not recorded yet</Text>
              )}
            </View>
          </Card>

          {reg && reg.status !== 'cancelled' ? (
            <Button label="Track points status" variant="secondary" icon="git-commit-outline" onPress={() => go(`/events/points-status?id=${e.id}`)} />
          ) : null}

          <SectionTitle title="Top placements" action="Full leaderboard" onAction={() => go(`/events/leaderboard?id=${e.id}`)} />
          {board.loading ? (
            <CardSkeleton count={1} height={180} />
          ) : board.error && !board.data ? (
            <ErrorState error={board.error} onRetry={board.reload} compact feature="Events" />
          ) : top.length ? (
            <View style={styles.list}>
              {top.map((entry, i) => (
                <EventLeaderRow key={`${entry.rank}-${entry.student.id ?? i}`} entry={entry} last={i === top.length - 1} />
              ))}
            </View>
          ) : (
            <Notice message="Placements appear once staff record attendance and results." />
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  mine: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  trophy: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  label: { ...Type.caption, color: Colors.muted },
  value: { ...Type.subheading, color: Colors.ink, marginTop: 2 },
  muted: { ...Type.small, color: Colors.muted, marginTop: 2 },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
});
