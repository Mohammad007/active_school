import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';

import { Touchable } from './Touchable';

type IconName = keyof typeof Ionicons.glyphMap;

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Accent colour when selected (defaults to brand). */
  colour?: string;
  style?: StyleProp<ViewStyle>;
}

/** Selectable filter chip (36px tall with a 44px hit area). */
export function Chip({ label, selected, onPress, icon, colour = Colors.primary, style }: ChipProps) {
  return (
    <Touchable
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      style={[styles.chip, selected && { backgroundColor: colour, borderColor: colour }, style]}>
      {icon ? <Ionicons name={icon} size={14} color={selected ? Colors.white : Colors.muted} /> : null}
      <Text style={[styles.chipText, selected && styles.chipTextOn]} numberOfLines={1}>
        {label}
      </Text>
    </Touchable>
  );
}

/** Horizontally scrolling chip row. */
export function ChipBar<K extends string | number>({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: K; label: string; icon?: IconName; colour?: string }[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bar}
      style={style}
      keyboardShouldPersistTaps="handled">
      {options.map((o) => (
        <Chip key={String(o.key)} label={o.label} icon={o.icon} colour={o.colour} selected={o.key === value} onPress={() => onChange(o.key)} />
      ))}
    </ScrollView>
  );
}

/** Wrapping single/multi select chips for forms. */
export function ChipGroup<K extends string | number>({
  options,
  selected,
  onToggle,
}: {
  options: { key: K; label: string; colour?: string }[];
  selected: K[];
  onToggle: (key: K) => void;
}) {
  return (
    <View style={styles.group}>
      {options.map((o) => (
        <Chip key={String(o.key)} label={o.label} colour={o.colour} selected={selected.includes(o.key)} onPress={() => onToggle(o.key)} />
      ))}
    </View>
  );
}

/** Underlined segmented tabs (e.g. Ongoing / Upcoming / Completed). */
export function SegmentedTabs<K extends string>({
  tabs,
  value,
  onChange,
  style,
}: {
  tabs: { key: K; label: string; count?: number }[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.tabs, style]} accessibilityRole="tablist">
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <Touchable
            key={t.key}
            onPress={() => onChange(t.key)}
            scaleTo={1}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.count ? `${t.label}, ${t.count}` : t.label}
            style={styles.tab}>
            <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
              {t.label}
              {t.count ? ` · ${t.count}` : ''}
            </Text>
            <View style={[styles.tabLine, on && styles.tabLineOn]} />
          </Touchable>
        );
      })}
    </View>
  );
}

/** Pill-style two/three option toggle (e.g. Season / All time). */
export function Toggle<K extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.toggle, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Touchable
            key={o.key}
            onPress={() => onChange(o.key)}
            scaleTo={1}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.toggleItem, on && styles.toggleItemOn]}>
            <Text style={[styles.toggleText, on && styles.toggleTextOn]}>{o.label}</Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    height: 36,
    paddingHorizontal: Spacing.md + 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
  },
  chipText: { ...Type.small, fontWeight: '500', color: Colors.body },
  chipTextOn: { color: Colors.white, fontWeight: '600' },
  bar: { paddingHorizontal: ScreenPadding, gap: Spacing.sm, paddingVertical: Spacing.sm },
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'flex-end' },
  tabText: { ...Type.small, fontWeight: '500', color: Colors.muted, paddingBottom: Spacing.sm + 2, paddingHorizontal: Spacing.xs },
  tabTextOn: { color: Colors.primary, fontWeight: '600' },
  tabLine: { height: 2, alignSelf: 'stretch', marginHorizontal: Spacing.md, borderRadius: 1, backgroundColor: Colors.transparent },
  tabLineOn: { backgroundColor: Colors.primary },
  toggle: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: 3 },
  toggleItem: { flex: 1, minHeight: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  toggleItemOn: { backgroundColor: Colors.surface },
  toggleText: { ...Type.small, fontWeight: '500', color: Colors.muted },
  toggleTextOn: { color: Colors.ink, fontWeight: '600' },
});
