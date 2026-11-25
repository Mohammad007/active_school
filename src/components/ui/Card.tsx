import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/theme';

import { Touchable } from './Touchable';

type IconName = keyof typeof Ionicons.glyphMap;

/** White surface with hairline border. */
export function Card({ children, style, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string }) {
  if (onPress) {
    return (
      <Touchable onPress={onPress} scaleTo={0.985} accessibilityLabel={accessibilityLabel} style={[styles.card, style]}>
        {children}
      </Touchable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Titled group of rows, settings-style. */
export function Section({ title, children, style, action }: { title?: string; children: ReactNode; style?: StyleProp<ViewStyle>; action?: ReactNode }) {
  return (
    <View style={[styles.section, style]}>
      {title || action ? (
        <View style={styles.sectionHead}>
          {title ? (
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {title}
            </Text>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string | null;
  icon?: IconName;
  iconColour?: string;
  value?: string | null;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  right?: ReactNode;
  last?: boolean;
  accessibilityLabel?: string;
}

/** Settings/list row (min 52px). */
export function ListRow({ title, subtitle, icon, iconColour = Colors.primary, value, onPress, chevron = !!onPress, destructive, right, last, accessibilityLabel }: RowProps) {
  const content = (
    <>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: destructive ? Colors.dangerTint : Colors.primaryTint }]}>
          <Ionicons name={icon} size={18} color={destructive ? Colors.danger : iconColour} />
        </View>
      ) : null}
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, destructive && { color: Colors.danger }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={Colors.subtle} /> : null}
    </>
  );
  const style = [styles.row, !last && styles.rowBorder];
  if (onPress) {
    return (
      <Touchable onPress={onPress} scaleTo={0.99} accessibilityLabel={accessibilityLabel ?? title} style={style}>
        {content}
      </Touchable>
    );
  }
  return <View style={style}>{content}</View>;
}

/** Row with a switch. */
export function SwitchRow({
  title,
  subtitle,
  value,
  onChange,
  disabled,
  last,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={title}
        trackColor={{ false: Colors.hairline, true: Colors.primary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

/** Label / value pair for detail screens. */
export function InfoRow({ label, value, icon, last }: { label: string; value?: string | null; icon?: IconName; last?: boolean }) {
  if (!value) return null;
  return (
    <View style={[styles.info, !last && styles.rowBorder]}>
      {icon ? <Ionicons name={icon} size={16} color={Colors.muted} style={styles.infoIcon} /> : null}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/** Big number + label used in profile / points summaries. */
export function Stat({ value, label, onPress }: { value: string | number; label: string; onPress?: () => void }) {
  const body = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </>
  );
  if (onPress) {
    return (
      <Touchable onPress={onPress} accessibilityLabel={`${value} ${label}`} style={styles.stat}>
        {body}
      </Touchable>
    );
  }
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: Spacing.lg,
  },
  section: { gap: Spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xs },
  sectionTitle: { ...Type.caption, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  rowIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1 },
  rowTitle: { ...Type.body, fontWeight: '500', color: Colors.ink },
  rowSub: { ...Type.caption, color: Colors.muted, marginTop: 2 },
  rowValue: { ...Type.small, color: Colors.muted, maxWidth: '45%' },
  info: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm + 2, gap: Spacing.sm },
  infoIcon: { marginTop: 2 },
  infoLabel: { ...Type.small, color: Colors.muted, width: 110 },
  infoValue: { ...Type.small, color: Colors.ink, flex: 1, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.hairline },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs, minHeight: 44, justifyContent: 'center' },
  statValue: { ...Type.stat, color: Colors.ink },
  statLabel: { ...Type.caption, color: Colors.muted, marginTop: 2 },
});
