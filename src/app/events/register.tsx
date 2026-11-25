import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ApiError, errorMessage, eventsApi } from '@/api';
import { DateTile, useEvent } from '@/components/modules/EventCard';
import { Button, Card, CardSkeleton, ErrorState, FeatureOff, FormScroll, Header, InfoRow, Notice, Screen, TextField } from '@/components/ui';
import { formatDate, formatDateTime, formatTime } from '@/lib/format';
import { goReplace } from '@/lib/nav';
import { useFeature } from '@/stores/session';
import { Colors, Spacing, Type } from '@/theme';

const CONFLICT_TITLES: Record<string, string> = {
  event_closed: 'Registration closed',
  registration_closed: 'Deadline passed',
  event_full: 'Event is full',
};

/** Register for an event: POST /events/{id}/register (team name for team events). */
export default function EventRegisterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enabled = useFeature('events');
  const q = useEvent(enabled ? id : undefined);
  const [team, setTeam] = useState('');
  const [teamError, setTeamError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const e = q.data;

  const submit = async () => {
    if (!e) return;
    if (e.team_event && !team.trim()) {
      setTeamError('Enter your team name.');
      return;
    }
    setBusy(true);
    setTeamError(null);
    try {
      const updated = await eventsApi.register(e.id, e.team_event ? team.trim() : undefined);
      if (updated.registration?.status === 'waitlisted') {
        Alert.alert('You are on the waitlist', 'The event is full. If a place opens up you will be registered automatically.');
      }
      goReplace(`/events/confirmation?id=${e.id}`);
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'team_required' || err.field('team_name'))) {
        setTeamError(err.field('team_name') ?? err.message);
      } else if (err instanceof ApiError && CONFLICT_TITLES[err.code]) {
        Alert.alert(CONFLICT_TITLES[err.code], err.message);
        q.reload();
      } else {
        Alert.alert('Could not register', errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!enabled) {
    return (
      <Screen>
        <Header title="Register" />
        <FeatureOff name="Events" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Register" subtitle={e?.title} />
      {q.loading ? (
        <CardSkeleton count={2} height={140} />
      ) : !e ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Events" />
      ) : (
        <FormScroll footer={<Button label={e.spots_left === 0 ? 'Join waitlist' : 'Confirm registration'} onPress={submit} loading={busy} />}>
          <Card style={styles.summary}>
            <DateTile value={e.starts_at} />
            <View style={styles.flex}>
              <Text style={styles.title}>{e.title}</Text>
              <Text style={styles.muted}>
                {formatDate(e.starts_at)}, {formatTime(e.starts_at)} · {e.level_label}
              </Text>
            </View>
          </Card>
          <Card>
            <InfoRow label="Venue" value={e.venue_hidden ? 'Shared after you register' : e.venue || 'To be announced'} icon="location-outline" />
            <InfoRow label="Register by" value={e.registration_closes_at ? formatDateTime(e.registration_closes_at) : null} icon="alarm-outline" />
            <InfoRow label="Eligibility" value={e.eligibility} icon="school-outline" />
            <InfoRow label="Places left" value={e.spots_left !== null ? String(e.spots_left) : 'Open'} icon="people-outline" last />
          </Card>
          {e.team_event ? (
            <TextField
              label="Team name"
              placeholder="e.g. Class 8B Strikers"
              value={team}
              onChangeText={(t) => {
                setTeam(t);
                if (teamError) setTeamError(null);
              }}
              error={teamError}
              maxLength={80}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          ) : null}
          {e.spots_left === 0 ? <Notice tone="warning" message="This event is full. You will join the waitlist if it has one." /> : null}
          <Notice
            message="Registration alone earns no points; staff confirm attendance and results."
          />
        </FormScroll>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  title: { ...Type.subheading, color: Colors.ink },
  muted: { ...Type.small, color: Colors.muted, marginTop: 2 },
});
