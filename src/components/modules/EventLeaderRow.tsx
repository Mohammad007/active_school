import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Touchable } from '@/components/ui';
import { go } from '@/lib/nav';
import { Colors, Radius, Spacing, Type } from '@/theme';
import type { EventLeaderboard } from '@/types';

type Entry = EventLeaderboard['entries'][number];

const MEDAL: Record<number, { bg: string; fg: string }> = {
  1: { bg: Colors.goldTint, fg: Colors.gold },
  2: { bg: Colors.silverTint, fg: Colors.silver },
  3: { bg: Colors.bronzeTint, fg: Colors.bronze },
};

/** results_status: provisional | final */
export function resultsStatusPill(status: string | null | undefined) {
  const final = status === 'final';
  return final
    ? { label: 'Final results', tone: 'success' as const, icon: 'checkmark-circle' as const }
    : { label: 'Provisional', tone: 'warning' as const, icon: 'hourglass-outline' as const };
}

/** One placement on an event leaderboard; the viewer's row is highlighted. */
export function EventLeaderRow({ entry, last }: { entry: Entry; last?: boolean }) {
  const s = entry.student;
  const medal = MEDAL[entry.rank];
  const me = s.is_me;
  const open = s.id && !me ? () => go(`/students/${s.id}`) : undefined;
  const body = (
    <>
      <View style={[styles.rank, medal && { backgroundColor: medal.bg }]}>
        <Text style={[styles.rankText, medal && { color: medal.fg }]}>{entry.rank}</Text>
      </View>
      <Avatar uri={s.avatar_url} name={s.display_name} size={36} />
      <View style={styles.flex}>
        <Text style={styles.name} numberOfLines={1}>
          {s.display_name}
          {me ? ' (you)' : ''}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[entry.result_label, s.class_label].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.points}>{entry.points}</Text>
        <View style={styles.verified}>
          <Ionicons name={entry.verified ? 'checkmark-circle' : 'time-outline'} size={12} color={entry.verified ? Colors.success : Colors.muted} />
          <Text style={styles.verifiedText}>{entry.verified ? 'Verified' : 'Pending'}</Text>
        </View>
      </View>
    </>
  );
  const style = [styles.row, me && styles.me, !last && styles.border];
  const label = `Rank ${entry.rank}, ${s.display_name}, ${entry.result_label}, ${entry.points} points, ${entry.verified ? 'verified' : 'pending'}`;
  if (open) {
    return (
      <Touchable onPress={open} scaleTo={0.99} style={style} accessibilityLabel={label}>
        {body}
      </Touchable>
    );
  }
  return (
    <View style={style} accessible accessibilityLabel={label}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, minHeight: 60 },
  me: { backgroundColor: Colors.primaryTint },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  rank: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceAlt },
  rankText: { ...Type.small, fontWeight: '700', color: Colors.body },
  name: { ...Type.body, fontWeight: '600', color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted, marginTop: 1 },
  right: { alignItems: 'flex-end' },
  points: { ...Type.subheading, color: Colors.ink },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText: { ...Type.micro, color: Colors.muted },
});
