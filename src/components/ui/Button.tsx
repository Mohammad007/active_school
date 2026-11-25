import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, HitSize, Radius, Spacing, Type } from '@/theme';

import { Touchable } from './Touchable';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
type IconName = keyof typeof Ionicons.glyphMap;

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to the container width (default true for md). */
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: Colors.primary, fg: Colors.white, border: Colors.primary },
  accent: { bg: Colors.accent, fg: Colors.white, border: Colors.accent },
  secondary: { bg: Colors.primaryTint, fg: Colors.primary, border: Colors.primaryTint },
  outline: { bg: Colors.surface, fg: Colors.ink, border: Colors.hairline },
  ghost: { bg: Colors.transparent, fg: Colors.primary, border: Colors.transparent },
  danger: { bg: Colors.dangerTint, fg: Colors.danger, border: Colors.dangerTint },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  full,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;
  const stretch = full ?? size === 'md';
  return (
    <Touchable
      onPress={onPress}
      disabled={inactive}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: p.bg, borderColor: p.border },
        stretch ? styles.full : styles.inline,
        inactive && styles.inactive,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={p.fg} /> : null}
          <Text style={[size === 'sm' ? styles.labelSm : styles.label, { color: p.fg }]} numberOfLines={1}>
            {label}
          </Text>
          {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 16 : 18} color={p.fg} /> : null}
        </View>
      )}
    </Touchable>
  );
}

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  size?: number;
  /** Small dot/count badge (e.g. unread notifications). */
  badge?: number;
  filled?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** 44x44 icon-only button with an accessibility label. */
export function IconButton({ icon, onPress, label, color = Colors.ink, size = 22, badge, filled, disabled, style }: IconButtonProps) {
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
      hitSlop={4}
      scaleTo={0.9}
      style={[styles.icon, filled && styles.iconFilled, disabled && styles.inactive, style]}>
      <Ionicons name={icon} size={size} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  md: { minHeight: 48, paddingHorizontal: Spacing.lg },
  sm: { minHeight: 36, paddingHorizontal: Spacing.md, borderRadius: Radius.sm },
  full: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  inactive: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { ...Type.button },
  labelSm: { ...Type.small, fontWeight: '600' },
  icon: { width: HitSize, height: HitSize, borderRadius: HitSize / 2, alignItems: 'center', justifyContent: 'center' },
  iconFilled: { backgroundColor: Colors.surfaceAlt },
  badge: {
    position: 'absolute',
    top: 6,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: { ...Type.micro, fontSize: 9, lineHeight: 11, color: Colors.white, fontWeight: '700' },
});
