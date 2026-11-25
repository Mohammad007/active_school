import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Pill, ProgressBar } from '@/components/ui';
import { artFor } from '@/lib/art';
import { iconName } from '@/lib/icons';
import { plural } from '@/lib/format';
import { go } from '@/lib/nav';
import { Colors, Illustrations, Radius, Spacing, Type, safeColour, tint } from '@/theme';
import type { Challenge } from '@/types';

export function challengeState(c: Challenge): { label: string; tone: 'success' | 'info' | 'neutral' | 'warning' } {
  if (c.completed) return { label: 'Completed', tone: 'success' };
  if (c.state === 'upcoming') return { label: 'Upcoming', tone: 'info' };
  if (c.state === 'ended') return { label: 'Ended', tone: 'neutral' };
  return { label: c.days_left > 0 ? `${plural(c.days_left, 'day')} left` : 'Ends today', tone: 'warning' };
}

/** Challenge card for the list: image or category-tinted header, progress when joined. */
export function ChallengeCard({ challenge: c }: { challenge: Challenge }) {
  const colour = safeColour(c.category?.colour);
  const state = challengeState(c);
  return (
    <Card onPress={() => go(`/challenges/${c.id}`)} style={styles.card} accessibilityLabel={`${c.title}, ${state.label}`}>
      {c.image_url ? (
        <Image source={{ uri: c.image_url }} style={styles.image} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.image, styles.placeholder, { backgroundColor: tint(colour, 0.12) }]}>
          <Image
            source={Illustrations[artFor(c.category?.slug, c.title)]}
            style={styles.art}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={[styles.badgeIcon, { backgroundColor: colour }]}>
            <Ionicons name={iconName(c.category?.icon ?? c.category?.slug, 'flag')} size={18} color={Colors.white} />
          </View>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Pill label={state.label} tone={state.tone} />
          {c.joined && !c.completed ? <Pill label="Joined" tone="info" icon="checkmark" /> : null}
          {c.category ? <Pill label={c.category.name} colour={c.category.colour} /> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {c.title}
        </Text>
        {c.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {c.description}
          </Text>
        ) : null}
        {c.joined ? (
          <View style={styles.progress}>
            <ProgressBar value={c.target ? c.progress / c.target : 0} colour={c.completed ? Colors.success : Colors.primary} />
            <Text style={styles.meta}>
              {c.progress}/{c.target} approved
            </Text>
          </View>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={14} color={Colors.muted} />
            <Text style={styles.meta}>{plural(c.participants, 'participant')}</Text>
          </View>
          {c.badge ? (
            <View style={styles.metaRow}>
              <Ionicons name={iconName(c.badge.icon)} size={14} color={safeColour(c.badge.colour)} />
              <Text style={styles.meta} numberOfLines={1}>
                {c.badge.name}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  image: { width: '100%', height: 148, backgroundColor: Colors.skeleton },
  placeholder: { alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  art: { width: '80%', height: '92%' },
  badgeIcon: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  body: { padding: Spacing.md, gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2 },
  title: { ...Type.subheading, color: Colors.ink },
  desc: { ...Type.small, color: Colors.muted },
  progress: { gap: Spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 1 },
  meta: { ...Type.caption, color: Colors.muted },
});
