import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, characterFor, Touchable } from '@/components/ui';
import { iconName } from '@/lib/icons';
import { Colors, Radius, Spacing, Type, safeColour, tint } from '@/theme';
import type { Category } from '@/types';

const SIZE = 64;

/**
 * Story-style row at the top of Home: "Your story" opens Create, each
 * category ring filters the feed (tap again to clear).
 */
export function StoriesRow({
  categories,
  selected,
  onSelect,
  onCreate,
  me,
}: {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number | null) => void;
  onCreate: () => void;
  me?: { avatar_url?: string | null; display_name?: string | null; gender?: string | null } | null;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="tablist">
      <Touchable onPress={onCreate} scaleTo={0.94} style={styles.item} accessibilityLabel="Share your activity">
        <View style={[styles.ring, { borderColor: Colors.primarySoft }]}>
          <Avatar uri={me?.avatar_url} name={me?.display_name} character={characterFor(me?.gender)} size={SIZE - 8} />
          <View style={styles.plus}>
            <Ionicons name="add" size={14} color={Colors.white} />
          </View>
        </View>
        <Text style={styles.label} numberOfLines={1}>
          Your Story
        </Text>
      </Touchable>

      {categories.map((c) => {
        const colour = safeColour(c.colour);
        const on = selected === c.id;
        return (
          <Touchable
            key={c.id}
            onPress={() => onSelect(on ? null : c.id)}
            scaleTo={0.94}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${c.name}${on ? ', selected' : ''}`}>
            <View style={[styles.ring, { borderColor: on ? colour : tint(colour, 0.45) }, on && styles.ringOn]}>
              <View style={[styles.inner, { backgroundColor: tint(colour, 0.14) }]}>
                <Ionicons name={iconName(c.icon ?? c.slug, 'sparkles')} size={26} color={colour} />
              </View>
            </View>
            <Text style={[styles.label, on && { color: colour, fontWeight: '700' }]} numberOfLines={1}>
              {c.name}
            </Text>
          </Touchable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.md },
  item: { width: SIZE + 8, alignItems: 'center', gap: Spacing.xs },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOn: { borderWidth: 3.5 },
  inner: { width: SIZE - 10, height: SIZE - 10, borderRadius: (SIZE - 10) / 2, alignItems: 'center', justifyContent: 'center' },
  plus: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...Type.caption, color: Colors.body, textAlign: 'center' },
});
