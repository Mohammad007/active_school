import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { registrationPill, useEvent } from '@/components/modules/EventCard';
import { Button, Card, CardSkeleton, EmptyState, ErrorState, FeatureOff, Header, InfoRow, Pill, Screen, contentWidth } from '@/components/ui';
import { formatDate, formatDateTime, formatTime } from '@/lib/format';
import { go, goBack } from '@/lib/nav';
import { useFeature } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';

/** Registration confirmation with the registration code (GET /events/{id}). */
export default function EventConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enabled = useFeature('events');
  const q = useEvent(enabled ? id : undefined);
  const e = q.data;
  const reg = e?.registration;
  const pill = registrationPill(reg ?? null);
  const waitlisted = reg?.status === 'waitlisted';

  return (
    <Screen>
      <Header title="Registration" />
      {!enabled ? (
        <FeatureOff name="Events" />
      ) : q.loading ? (
        <CardSkeleton count={2} height={160} />
      ) : !e ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Events" />
      ) : !reg || reg.status === 'cancelled' ? (
        <EmptyState
          icon="ticket-outline"
          title="Not registered"
          message="You do not have an active registration for this event."
          actionLabel="View event"
          onAction={() => go(`/events/${e.id}`)}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, contentWidth]}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
          <View style={styles.hero}>
            <Animated.View entering={ZoomIn.springify()} style={[styles.icon, waitlisted && styles.iconWait]}>
              <Ionicons name={waitlisted ? 'time' : 'checkmark'} size={32} color={Colors.white} />
            </Animated.View>
            <Text style={styles.title} accessibilityRole="header">
              {waitlisted ? 'You are on the waitlist' : "You're registered!"}
            </Text>
            <Text style={styles.muted}>{e.title}</Text>
          </View>

          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>Registration code</Text>
            <Text style={styles.code} selectable accessibilityLabel={`Registration code ${reg.code.split('').join(' ')}`}>
              {reg.code}
            </Text>
            <Text style={styles.mutedSmall}>Show this code at the event check-in.</Text>
            {pill ? <Pill label={pill.label} tone={pill.tone} icon={pill.icon} style={styles.center} /> : null}
          </Card>

          <Card>
            <InfoRow label="When" value={`${formatDate(e.starts_at)}, ${formatTime(e.starts_at)}`} icon="time-outline" />
            <InfoRow label="Venue" value={e.venue_hidden ? 'Shared once your place is confirmed' : e.venue || 'To be announced'} icon="location-outline" />
            <InfoRow label="Team" value={reg.team_name} icon="people-outline" />
            <InfoRow label="Registered" value={formatDateTime(reg.registered_at)} icon="calendar-outline" last />
          </Card>

          <View style={styles.actions}>
            <Button label="View event" variant="secondary" onPress={() => go(`/events/${e.id}`)} />
            <Button label="Done" onPress={() => goBack('/events')} />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.md },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  iconWait: { backgroundColor: Colors.accent },
  title: { ...Type.title, color: Colors.ink, textAlign: 'center' },
  muted: { ...Type.body, color: Colors.muted, textAlign: 'center' },
  mutedSmall: { ...Type.caption, color: Colors.muted, textAlign: 'center' },
  codeCard: { alignItems: 'center', gap: Spacing.sm, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primarySoft, borderRadius: Radius.lg },
  codeLabel: { ...Type.caption, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  code: { ...Type.display, color: Colors.primary, letterSpacing: 2 },
  center: { alignSelf: 'center' },
  actions: { gap: Spacing.sm },
});
