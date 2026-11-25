import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Pill, type Tone } from '@/components/ui';
import { eventsApi } from '@/api';
import { useQuery } from '@/hooks/useQuery';
import { dateParts, formatTime, plural } from '@/lib/format';
import { go } from '@/lib/nav';
import { Colors, Radius, Spacing, Type } from '@/theme';
import type { AppEvent, EventRegistration } from '@/types';

export const EVENT_STAGES = ['Registered', 'Event started', 'Attendance confirmed', 'Result under review', 'Points approved', 'Points credited'];

export function registrationPill(reg: EventRegistration | null): { label: string; tone: Tone; icon: 'checkmark-circle' | 'time-outline' | 'close-circle' | 'ribbon' } | null {
  if (!reg) return null;
  switch (reg.status) {
    case 'registered':
      return { label: 'Registered', tone: 'success', icon: 'checkmark-circle' };
    case 'waitlisted':
      return { label: 'Waitlisted', tone: 'warning', icon: 'time-outline' };
    case 'attended':
      return { label: 'Attended', tone: 'info', icon: 'ribbon' };
    case 'cancelled':
      return { label: 'Cancelled', tone: 'neutral', icon: 'close-circle' };
    default:
      return { label: reg.status, tone: 'neutral', icon: 'time-outline' };
  }
}

/** True when an ISO timestamp is in the past. */
export function isPast(iso: string | null | undefined): boolean {
  return !!iso && new Date(iso).getTime() < Date.now();
}

/** Shared loader for the event sub-screens (`?id=`). */
export function useEvent(id: string | undefined) {
  return useQuery(() => eventsApi.get(id as string), [id], { enabled: !!id, refetchOnFocus: true });
}

/** Calendar-style date tile. */
export function DateTile({ value, size = 52 }: { value: string; size?: number }) {
  const p = dateParts(value);
  return (
    <View style={[styles.tile, { width: size, height: size }]} accessible accessibilityLabel={`${p.weekday} ${p.day} ${p.month}`}>
      <Text style={styles.tileMonth}>{p.month}</Text>
      <Text style={styles.tileDay}>{p.day}</Text>
    </View>
  );
}

export function EventCard({ event: e }: { event: AppEvent }) {
  const reg = registrationPill(e.registration);
  const p = dateParts(e.starts_at);
  return (
    <Card onPress={() => go(`/events/${e.id}`)} style={styles.card} accessibilityLabel={`${e.title}, ${p.weekday} ${p.day} ${p.month}`}>
      <DateTile value={e.starts_at} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {e.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {p.weekday}, {formatTime(e.starts_at)} · {e.level_label}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name={e.venue_hidden ? 'lock-closed-outline' : 'location-outline'} size={13} color={Colors.muted} />
          <Text style={styles.meta} numberOfLines={1}>
            {e.venue_hidden ? 'Venue shared after registration' : e.venue || 'Venue to be announced'}
          </Text>
        </View>
        <View style={styles.pills}>
          {reg ? <Pill label={reg.label} tone={reg.tone} icon={reg.icon} /> : null}
          {e.category ? <Pill label={e.category.name} colour={e.category.colour} /> : null}
          {e.status === 'upcoming' && e.spots_left !== null ? (
            <Pill label={e.spots_left > 0 ? `${plural(e.spots_left, 'spot')} left` : 'Full'} tone={e.spots_left > 0 ? 'neutral' : 'danger'} />
          ) : null}
          {e.status === 'cancelled' ? <Pill label="Cancelled" tone="danger" /> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md, flex: 1 },
  tile: { borderRadius: Radius.md, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  tileMonth: { ...Type.micro, color: Colors.primary, fontWeight: '700' },
  tileDay: { ...Type.stat, color: Colors.primary },
  body: { flex: 1, gap: Spacing.xs },
  title: { ...Type.subheading, color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2, marginTop: Spacing.xs },
});
