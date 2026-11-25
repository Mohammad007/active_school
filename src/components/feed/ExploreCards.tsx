import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Pill, ProgressBar, Touchable } from '@/components/ui';
import { artFor } from '@/lib/art';
import { compactNumber, dateParts, formatTime, plural } from '@/lib/format';
import { iconName } from '@/lib/icons';
import { go } from '@/lib/nav';
import { Colors, Illustrations, Radius, Spacing, Type, safeColour, tint } from '@/theme';
import type { Activity, AppEvent, Challenge } from '@/types';

/** Compact challenge card for horizontal rails. */
export function ChallengeMiniCard({ challenge, width }: { challenge: Challenge; width: number }) {
  const colour = safeColour(challenge.category?.colour ?? challenge.badge?.colour);
  return (
    <Touchable
      scaleTo={0.98}
      onPress={() => go(`/challenges/${challenge.id}`)}
      accessibilityLabel={`${challenge.title}, ${challenge.days_left} days left`}
      style={[styles.card, { width }]}>
      <View style={[styles.cover, { backgroundColor: tint(colour, 0.14) }]}>
        {challenge.image_url ? (
          <Image source={{ uri: challenge.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <>
            <Image source={Illustrations[artFor(challenge.category?.slug, challenge.title)]} style={styles.coverArt} contentFit="contain" accessibilityIgnoresInvertColors />
            <View style={[styles.coverIcon, { backgroundColor: colour }]}>
              <Ionicons name={iconName(challenge.badge?.icon ?? challenge.category?.icon, 'flag')} size={14} color={Colors.white} />
            </View>
          </>
        )}
        {challenge.joined ? <Pill label={challenge.completed ? 'Completed' : 'Joined'} tone="success" icon="checkmark" style={styles.coverPill} /> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {challenge.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {challenge.state === 'upcoming' ? 'Starts soon' : challenge.days_left > 0 ? `${plural(challenge.days_left, 'day')} left` : 'Ends today'} ·{' '}
          {plural(challenge.participants, 'student')}
        </Text>
        {challenge.joined ? <ProgressBar value={challenge.target ? challenge.progress / challenge.target : 0} colour={colour} height={4} /> : null}
      </View>
    </Touchable>
  );
}

/** Event row with a date tile. */
export function EventMiniCard({ event }: { event: AppEvent }) {
  const d = dateParts(event.starts_at);
  const registered = event.registration && ['registered', 'attended', 'waitlisted'].includes(event.registration.status);
  return (
    <Touchable
      scaleTo={0.985}
      onPress={() => go(`/events/${event.id}`)}
      accessibilityLabel={`${event.title}, ${d.day} ${d.month}`}
      style={styles.event}>
      <View style={styles.dateTile}>
        <Text style={styles.dateMonth}>{d.month}</Text>
        <Text style={styles.dateDay}>{d.day}</Text>
      </View>
      <View style={styles.eventBody}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[d.weekday, formatTime(event.starts_at), event.level_label].filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.eventPills}>
          {registered ? (
            <Pill label={event.registration?.status === 'waitlisted' ? 'Waitlisted' : 'Registered'} tone={event.registration?.status === 'waitlisted' ? 'warning' : 'success'} icon="checkmark" />
          ) : event.spots_left === 0 ? (
            <Pill label="Full" tone="neutral" />
          ) : event.spots_left !== null ? (
            <Pill label={`${event.spots_left} spots left`} tone="info" />
          ) : null}
          {event.category ? <Pill label={event.category.name} colour={event.category.colour} /> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.subtle} />
    </Touchable>
  );
}

/** Photo tile for Explore -> Discover: cover photo, title, author and appreciations. */
export function DiscoverTile({ post, width }: { post: Activity; width: number }) {
  const photo = post.photos?.[0];
  return (
    <Touchable
      scaleTo={0.98}
      onPress={() => go(`/posts/${post.id}`)}
      accessibilityLabel={`${post.title} by ${post.author?.display_name ?? 'a student'}`}
      style={[styles.tile, { width }]}>
      <View style={[styles.tileCover, { height: width * 0.78 }]}>
        {photo ? (
          <Image source={{ uri: photo.thumb_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <Image source={Illustrations[artFor(post.category?.slug, post.title)]} style={styles.coverArt} contentFit="contain" />
        )}
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {post.title}
        </Text>
        <View style={styles.tileMeta}>
          <Text style={styles.meta} numberOfLines={1}>
            By {post.author?.display_name ?? 'Student'}
          </Text>
          <View style={styles.likes}>
            <Ionicons name="heart" size={13} color={Colors.heart} />
            <Text style={styles.likesText}>{compactNumber(post.appreciations_count)}</Text>
          </View>
        </View>
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  coverArt: { width: '82%', height: '92%' },
  coverIcon: { position: 'absolute', left: Spacing.sm, bottom: Spacing.sm, width: 26, height: 26, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  tile: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline, overflow: 'hidden' },
  tileCover: { width: '100%', backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  tileBody: { padding: Spacing.sm, gap: 2 },
  tileTitle: { ...Type.small, fontWeight: '600', color: Colors.ink },
  tileMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  likesText: { ...Type.caption, fontWeight: '600', color: Colors.body },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  cover: { height: 96, alignItems: 'center', justifyContent: 'center' },
  coverPill: { position: 'absolute', top: Spacing.sm, left: Spacing.sm },
  body: { padding: Spacing.md, gap: Spacing.xs + 2 },
  title: { ...Type.subheading, color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: Spacing.md,
  },
  dateTile: { width: 52, borderRadius: Radius.md, backgroundColor: Colors.primaryTint, alignItems: 'center', paddingVertical: Spacing.sm },
  dateMonth: { ...Type.micro, color: Colors.primary, fontWeight: '700' },
  dateDay: { ...Type.title, color: Colors.primary },
  eventBody: { flex: 1, gap: Spacing.xs },
  eventPills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2, marginTop: 2 },
});
