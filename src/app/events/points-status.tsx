import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EVENT_STAGES, useEvent } from '@/components/modules/EventCard';
import { Card, CardSkeleton, EmptyState, ErrorState, FeatureOff, Header, Notice, Pill, Screen, Steps, contentWidth } from '@/components/ui';
import { go } from '@/lib/nav';
import { useFeature, useSession } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';

const CAPTIONS = [
  'Your place is booked.',
  'The event has started.',
  'Staff confirmed you attended.',
  'Your result is being checked.',
  'A reviewer approved your points.',
  'Points added to your total.',
];

/** Where an event registration is on the way to points (registration.stage 0-5). */
export default function EventPointsStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enabled = useFeature('events');
  const results = useSession((s) => s.config?.results);
  const q = useEvent(enabled ? id : undefined);
  const e = q.data;
  const reg = e?.registration && e.registration.status !== 'cancelled' ? e.registration : null;
  const expected = reg?.result ? e?.points?.[reg.result] : undefined;

  return (
    <Screen>
      <Header title="Points status" subtitle={e?.title} />
      {!enabled ? (
        <FeatureOff name="Events" />
      ) : q.loading ? (
        <CardSkeleton count={2} height={200} />
      ) : !e ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Events" />
      ) : !reg ? (
        <EmptyState
          icon="git-commit-outline"
          title="Not registered"
          message="Register for this event to track attendance, results and points."
          actionLabel="View event"
          onAction={() => go(`/events/${e.id}`)}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, contentWidth]}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
          {reg.status === 'waitlisted' ? <Notice tone="warning" message="You are on the waitlist. Tracking starts once you have a place." /> : null}

          <Card style={styles.summary}>
            <View style={styles.flex}>
              <Text style={styles.label}>Result</Text>
              <Text style={styles.value}>{reg.result ? results?.[reg.result] ?? reg.result : 'Not recorded yet'}</Text>
              {reg.result ? (
                <Pill
                  label={reg.result_verified ? 'Verified' : 'Under review'}
                  tone={reg.result_verified ? 'success' : 'warning'}
                  icon={reg.result_verified ? 'checkmark-circle' : 'hourglass-outline'}
                  style={styles.pill}
                />
              ) : null}
            </View>
            <View style={styles.right}>
              <Text style={styles.label}>{reg.stage >= 5 ? 'Credited' : 'Expected'}</Text>
              <Text style={[styles.points, reg.stage < 5 && styles.pending]}>{expected !== undefined ? `${expected} pts` : '–'}</Text>
            </View>
          </Card>

          <Card>
            <Steps
              steps={EVENT_STAGES.map((title, i) => ({ title, caption: i <= reg.stage ? CAPTIONS[i] : null }))}
              current={Math.max(0, Math.min(EVENT_STAGES.length - 1, reg.stage))}
            />
          </Card>
          <Text style={styles.note}>Points are provisional until a reviewer verifies your result. Registration alone earns no points.</Text>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  summary: { flexDirection: 'row', gap: Spacing.md },
  right: { alignItems: 'flex-end' },
  label: { ...Type.caption, color: Colors.muted },
  value: { ...Type.subheading, color: Colors.ink, marginTop: 2 },
  pill: { marginTop: Spacing.sm },
  points: { ...Type.title, color: Colors.success, marginTop: 2 },
  pending: { color: Colors.muted },
  note: { ...Type.caption, color: Colors.muted, textAlign: 'center' },
});
