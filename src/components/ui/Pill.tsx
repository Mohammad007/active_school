import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing, Type, safeColour, tint } from '@/theme';
import type { ContentStatus } from '@/types';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
type IconName = keyof typeof Ionicons.glyphMap;

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: Colors.surfaceAlt, fg: Colors.body },
  info: { bg: Colors.primaryTint, fg: Colors.primary },
  success: { bg: Colors.successTint, fg: Colors.success },
  warning: { bg: Colors.warningTint, fg: Colors.warning },
  danger: { bg: Colors.dangerTint, fg: Colors.danger },
  accent: { bg: Colors.accentTint, fg: Colors.warning },
};

/**
 * Small status label. Always text (+ optional icon) so meaning never relies on colour alone.
 * Pass `colour` to tint with an API colour (e.g. a category).
 */
export function Pill({ label, tone = 'neutral', icon, colour, style }: { label: string; tone?: Tone; icon?: IconName; colour?: string | null; style?: StyleProp<ViewStyle> }) {
  const t = colour ? { bg: tint(safeColour(colour), 0.12), fg: safeColour(colour) } : tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={t.fg} /> : null}
      <Text style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Tone + icon for a submission's moderation / verification state. */
export function submissionTone(status: ContentStatus | undefined, verified?: boolean): { tone: Tone; icon: IconName } {
  if (verified) return { tone: 'success', icon: 'checkmark-circle' };
  switch (status) {
    case 'approved':
      return { tone: 'info', icon: 'time-outline' };
    case 'submitted':
      return { tone: 'warning', icon: 'hourglass-outline' };
    case 'changes_requested':
      return { tone: 'accent', icon: 'create-outline' };
    case 'rejected':
    case 'removed':
    case 'hidden':
      return { tone: 'danger', icon: 'close-circle' };
    default:
      return { tone: 'neutral', icon: 'document-outline' };
  }
}

/** Label shown for a submission: approved-but-unverified reads as "Points pending". */
export function submissionLabel(status: ContentStatus | undefined, label: string | undefined, verified?: boolean): string {
  if (verified) return 'Verified';
  if (status === 'approved') return 'Published · points pending';
  return label ?? 'Draft';
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  text: { ...Type.micro, fontWeight: '600' },
});
