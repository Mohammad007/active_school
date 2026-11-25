import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Touchable } from '@/components/ui';
import { compactNumber } from '@/lib/format';
import { go } from '@/lib/nav';
import { Colors, Radius, Spacing, Type } from '@/theme';
import type { LeaderboardEntry, StudentSummary } from '@/types';

export const MEDALS = {
  1: { colour: Colors.gold, tint: Colors.goldTint, label: '1st' },
  2: { colour: Colors.silver, tint: Colors.silverTint, label: '2nd' },
  3: { colour: Colors.bronze, tint: Colors.bronzeTint, label: '3rd' },
} as const;

/** Open a leaderboard student: own profile tab, peer profile, or nothing when hidden by privacy. */
export function openStudent(s: StudentSummary) {
  if (s.is_me) go('/(tabs)/profile');
  else if (s.id) go(`/students/${s.id}`);
}

function Place({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const m = MEDALS[place];
  const s = entry.student;
  const tappable = !!s.id;
  const size = place === 1 ? 68 : 56;
  return (
    <Touchable
      disabled={!tappable}
      onPress={() => openStudent(s)}
      scaleTo={0.97}
      accessibilityLabel={`${m.label} place, ${s.display_name}${s.is_me ? ' (you)' : ''}, ${entry.points} points`}
      style={styles.place}>
      <View style={[styles.avatarRing, { borderColor: m.colour }]}>
        <Avatar uri={s.avatar_url} name={s.display_name} size={size} />
        <View style={[styles.medal, { backgroundColor: m.colour }]}>
          <Text style={styles.medalText}>{place}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {s.is_me ? 'You' : s.display_name}
      </Text>
      <Text style={styles.cls} numberOfLines={1}>
        {s.class_label ?? ' '}
      </Text>
      <View style={[styles.block, { backgroundColor: m.tint, height: place === 1 ? 64 : place === 2 ? 48 : 38 }]}>
        <Text style={[styles.points, { color: Colors.ink }]}>{compactNumber(entry.points)}</Text>
        <Text style={styles.pts}>pts</Text>
      </View>
    </Touchable>
  );
}

/** Top-three podium (2 · 1 · 3). */
export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const [first, second, third] = entries;
  if (!first) return null;
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.slot}>{second ? <Place entry={second} place={2} /> : null}</View>
      <View style={styles.slot}>
        <Ionicons name="trophy" size={18} color={Colors.gold} style={styles.crown} />
        <Place entry={first} place={1} />
      </View>
      <View style={styles.slot}>{third ? <Place entry={third} place={3} /> : null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingTop: Spacing.md },
  slot: { flex: 1, alignItems: 'center' },
  crown: { marginBottom: Spacing.xs },
  place: { alignItems: 'center', width: '100%' },
  avatarRing: { borderWidth: 2, borderRadius: 999, padding: 2 },
  medal: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  medalText: { ...Type.micro, color: Colors.white, fontWeight: '700' },
  name: { ...Type.small, fontWeight: '600', color: Colors.ink, marginTop: Spacing.sm, maxWidth: '100%' },
  cls: { ...Type.caption, color: Colors.muted },
  block: {
    marginTop: Spacing.sm,
    width: '100%',
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  points: { ...Type.subheading },
  pts: { ...Type.caption, color: Colors.muted },
});
