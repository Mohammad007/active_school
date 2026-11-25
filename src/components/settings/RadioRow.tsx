import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Touchable } from '@/components/ui';
import { Colors, Spacing, Type } from '@/theme';

/** Single-choice row with a radio indicator (min 52px). */
export function RadioRow({
  title,
  subtitle,
  selected,
  onPress,
  last,
  disabled,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
  disabled?: boolean;
}) {
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.99}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      style={[styles.row, !last && styles.border]}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? Colors.primary : Colors.subtle} />
    </Touchable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  body: { flex: 1 },
  title: { ...Type.body, fontWeight: '500', color: Colors.ink },
  subtitle: { ...Type.caption, color: Colors.muted, marginTop: 2 },
});
