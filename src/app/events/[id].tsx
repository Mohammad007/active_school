import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage, eventsApi } from '@/api';
import { ArtHero } from '@/components/modules/ArtHero';
import { startLinkedDraft } from '@/components/modules/draft';
import { DateTile, isPast, registrationPill, useEvent } from '@/components/modules/EventCard';
import { Button, Card, CardSkeleton, ErrorState, FeatureOff, Header, InfoRow, ListRow, Notice, Pill, Screen, Section, contentWidth } from '@/components/ui';
import { artFor } from '@/lib/art';
import { formatDate, formatDateTime, formatTime, stripHtml } from '@/lib/format';
import { go } from '@/lib/nav';
import { useFeature, useSession } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type, safeColour } from '@/theme';
import type { ActivityResult } from '@/types';

const RESULT_ORDER: ActivityResult[] = ['first', 'second', 'third', 'participation'];

/** Event detail: GET /events/{id}; register / cancel; links to registration sub-screens. */
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enabled = useFeature('events');
  const results = useSession((s) => s.config?.results);
  const q = useEvent(enabled ? id : undefined);
  const [busy, setBusy] = useState(false);
  const e = q.data;

  if (!enabled) {
    return (
      <Screen>
        <Header title="Event" />
        <FeatureOff name="Events" />
      </Screen>
    );
  }

  const reg = e?.registration && e.registration.status !== 'cancelled' ? e.registration : null;
  const pill = registrationPill(e?.registration ?? null);
  const active = !!reg && (reg.status === 'registered' || reg.status === 'waitlisted');
  const completed = e?.status === 'completed';
  const deadlinePassed = isPast(e?.registration_closes_at);
  // When full the server either waitlists or answers 409 event_full (waitlist setting is not exposed).
  const canRegister = !!e && e.status === 'upcoming' && !active && !deadlinePassed;

  const cancel = () => {
    if (!e) return;
    Alert.alert('Cancel registration?', reg?.status === 'registered' ? 'Your place may go to someone on the waitlist.' : 'You will leave the waitlist.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel registration',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await eventsApi.cancel(e.id);
            await q.reload();
          } catch (err) {
            Alert.alert('Could not cancel', errorMessage(err));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const description = stripHtml(e?.description);
  const points = e ? RESULT_ORDER.filter((r) => e.points?.[r] !== undefined) : [];

  return (
    <Screen>
      <Header title={e?.title ?? 'Event'} />
      {q.loading ? (
        <CardSkeleton count={2} height={180} />
      ) : !e ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Events" />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, contentWidth]}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
          {e.image_url ? (
            <Image source={{ uri: e.image_url }} style={styles.hero} contentFit="cover" transition={150} accessibilityLabel={e.title} />
          ) : (
            <ArtHero art={artFor(e.category?.slug, e.title)} colour={safeColour(e.category?.colour)} icon={e.category?.icon ?? e.category?.slug} label={e.title} />
          )}

          <View style={styles.titleRow}>
            <DateTile value={e.starts_at} size={56} />
            <View style={styles.flex}>
              <Text style={styles.title} accessibilityRole="header">
                {e.title}
              </Text>
              <View style={styles.pills}>
                {pill ? <Pill label={pill.label} tone={pill.tone} icon={pill.icon} /> : null}
                <Pill label={e.level_label} tone="info" />
                {e.category ? <Pill label={e.category.name} colour={e.category.colour} /> : null}
                {e.team_event ? <Pill label="Team event" tone="neutral" icon="people" /> : null}
                {e.status === 'cancelled' ? <Pill label="Cancelled" tone="danger" /> : null}
              </View>
            </View>
          </View>

          {reg?.status === 'waitlisted' ? (
            <Notice tone="warning" title="You are on the waitlist" message="If a place opens up you will be registered automatically and notified." />
          ) : null}

          <Card>
            <InfoRow label="When" value={`${formatDate(e.starts_at)}, ${formatTime(e.starts_at)}${e.ends_at ? ` – ${formatTime(e.ends_at)}` : ''}`} icon="time-outline" />
            <InfoRow label="Register by" value={e.registration_closes_at ? formatDateTime(e.registration_closes_at) : null} icon="alarm-outline" />
            <InfoRow label="Venue" value={e.venue_hidden ? 'Shared with registered students' : e.venue || 'To be announced'} icon={e.venue_hidden ? 'lock-closed-outline' : 'location-outline'} />
            <InfoRow label="Organiser" value={e.organizer} icon="business-outline" />
            <InfoRow label="Eligibility" value={e.eligibility} icon="school-outline" />
            <InfoRow
              label="Places"
              value={e.capacity !== null ? `${e.registered_count}/${e.capacity} taken${e.spots_left === 0 ? ' · full' : ''}` : `${e.registered_count} registered`}
              icon="people-outline"
              last
            />
          </Card>

          {description ? (
            <View style={styles.gap}>
              <Text style={styles.section}>About</Text>
              <Text style={styles.body}>{description}</Text>
            </View>
          ) : null}

          {points.length ? (
            <Card style={styles.gap}>
              <Text style={styles.cardTitle}>Points at {e.level_label} level</Text>
              <View style={styles.pointsGrid}>
                {points.map((r) => (
                  <View key={r} style={styles.pointCell}>
                    <Text style={styles.pointValue}>{e.points[r]}</Text>
                    <Text style={styles.pointLabel} numberOfLines={1}>
                      {results?.[r] ?? r}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.muted}>Registration alone earns no points. Attendance and results are confirmed by staff.</Text>
            </Card>
          ) : null}

          <Section title="More">
            <ListRow title="Rules & scoring" icon="document-text-outline" onPress={() => go(`/events/rules?id=${e.id}`)} last={!reg && !completed} />
            {reg ? <ListRow title="My registration" subtitle={`Code ${reg.code}`} icon="ticket-outline" onPress={() => go(`/events/confirmation?id=${e.id}`)} /> : null}
            {reg ? <ListRow title="Points status" icon="git-commit-outline" onPress={() => go(`/events/points-status?id=${e.id}`)} last={!completed} /> : null}
            {completed ? <ListRow title="Results" icon="trophy-outline" onPress={() => go(`/events/results?id=${e.id}`)} /> : null}
            {completed ? <ListRow title="Event leaderboard" icon="podium-outline" onPress={() => go(`/events/leaderboard?id=${e.id}`)} last /> : null}
          </Section>

          <View style={styles.actions}>
            {canRegister ? (
              <Button
                label={e.spots_left === 0 ? 'Join waitlist' : 'Register'}
                icon="checkmark-circle-outline"
                onPress={() => go(`/events/register?id=${e.id}`)}
              />
            ) : null}
            {e.status === 'upcoming' && !active && deadlinePassed ? <Text style={[styles.muted, styles.center]}>Registration has closed.</Text> : null}
            {reg?.status === 'attended' ? (
              <Button
                label="Add as activity"
                icon="camera-outline"
                variant="secondary"
                onPress={() => startLinkedDraft({ event: { id: e.id, title: e.title }, categoryId: e.category?.id ?? null, level: e.level })}
              />
            ) : null}
            {active && e.status === 'upcoming' ? <Button label="Cancel registration" variant="ghost" onPress={cancel} loading={busy} /> : null}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.lg, backgroundColor: Colors.skeleton },
  titleRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  title: { ...Type.title, color: Colors.ink },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2, marginTop: Spacing.sm },
  gap: { gap: Spacing.sm },
  section: { ...Type.subheading, color: Colors.ink },
  body: { ...Type.body, color: Colors.body },
  cardTitle: { ...Type.subheading, color: Colors.ink },
  muted: { ...Type.small, color: Colors.muted },
  center: { textAlign: 'center' },
  pointsGrid: { flexDirection: 'row', gap: Spacing.sm },
  pointCell: { flex: 1, backgroundColor: Colors.primaryTint, borderRadius: Radius.md, paddingVertical: Spacing.sm, alignItems: 'center' },
  pointValue: { ...Type.stat, color: Colors.primary },
  pointLabel: { ...Type.micro, color: Colors.muted, marginTop: 2 },
  actions: { gap: Spacing.sm },
});
