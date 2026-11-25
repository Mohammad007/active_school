import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Pill, ProgressBar } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { iconName, type IconName } from '@/lib/icons';
import { go } from '@/lib/nav';
import { Colors, Radius, Spacing, Type, safeColour, tint } from '@/theme';
import type { Goal } from '@/types';

/** Colours a student can pick for a goal (all brand tokens). */
export const GOAL_COLOURS: string[] = [Colors.primary, Colors.accent, Colors.success, Colors.danger, Colors.warning, Colors.gold, Colors.bronze, Colors.silver];

/** Icons a student can pick for a goal. */
export const GOAL_ICONS: IconName[] = ['flag', 'football', 'book', 'color-palette', 'musical-notes', 'flask', 'leaf', 'people', 'trophy', 'star'];

export function GoalCard({ goal: g }: { goal: Goal }) {
  const colour = safeColour(g.colour);
  const paused = g.status === 'paused';
  return (
    <Card onPress={() => go(`/goals/${g.id}`)} style={styles.card} accessibilityLabel={`${g.title}, ${g.progress} of ${g.target}`}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: tint(colour, 0.14) }]}>
          <Ionicons name={iconName(g.icon, 'flag')} size={20} color={colour} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title} numberOfLines={1}>
            {g.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {g.period_label}
            {g.category ? ` · ${g.category.name}` : ''}
            {g.deadline ? ` · by ${formatDate(g.deadline, false)}` : ''}
          </Text>
        </View>
        {g.achieved ? <Pill label="Achieved" tone="success" icon="checkmark-circle" /> : paused ? <Pill label="Paused" tone="neutral" icon="pause" /> : null}
      </View>
      <View style={styles.progressRow}>
        <ProgressBar value={g.target ? g.progress / g.target : 0} colour={paused ? Colors.subtle : g.achieved ? Colors.success : colour} style={styles.flex} />
        <Text style={styles.count}>
          {g.progress}/{g.target}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: Spacing.md, padding: Spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { ...Type.subheading, color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  count: { ...Type.small, fontWeight: '600', color: Colors.ink, minWidth: 40, textAlign: 'right' },
});
