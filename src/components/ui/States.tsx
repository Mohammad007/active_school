import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ApiError } from '@/api';
import { Colors, Illustrations, Radius, Spacing, Type, type IllustrationKey } from '@/theme';

import { Button } from './Button';
import { contentWidth } from './Screen';

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  /** A drawn character shown instead of the icon. */
  art?: IllustrationKey;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function EmptyState({ icon = 'sparkles-outline', art, title, message, actionLabel, onAction, style, compact }: EmptyStateProps) {
  const artSize = compact ? 120 : 170;
  return (
    <Animated.View entering={FadeIn.duration(220)} style={[styles.wrap, compact && styles.compact, contentWidth, style]}>
      {art ? (
        <View style={[styles.artWrap, { width: artSize, height: artSize, borderRadius: artSize / 2 }]}>
          <Image source={Illustrations[art]} style={{ width: artSize * 0.92, height: artSize * 0.92 }} contentFit="contain" accessibilityIgnoresInvertColors />
        </View>
      ) : (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={26} color={Colors.primary} />
        </View>
      )}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} size="sm" variant="secondary" style={styles.action} />
      ) : null}
    </Animated.View>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  /** Name of the module, for the "switched off" message. */
  feature?: string;
}

/** Error with retry; special-cases offline, not-found and module switched off for the school. */
export function ErrorState({ error, onRetry, style, compact, feature }: ErrorStateProps) {
  const e = error instanceof ApiError ? error : null;
  if (e?.isFeatureOff) {
    return <FeatureOff name={feature} style={style} />;
  }
  if (e?.isNotFound) {
    return (
      <EmptyState
        icon="eye-off-outline"
        title="Not available"
        message="This may have been removed, or it is not visible to you."
        style={style}
        compact={compact}
      />
    );
  }
  const offline = e?.isNetwork;
  return (
    <EmptyState
      icon={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
      title={offline ? 'You are offline' : 'Could not load this'}
      message={e?.message ?? (error instanceof Error ? error.message : 'Something went wrong. Please try again.')}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
      style={style}
      compact={compact}
    />
  );
}

/** A module (challenges, events, goals...) switched off for this school. */
export function FeatureOff({ name, style }: { name?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <EmptyState
      icon="lock-closed-outline"
      title={name ? `${name} are not available` : 'Not available'}
      message="Your school has not switched this feature on yet."
      style={style}
    />
  );
}

/** Centered spinner for whole-screen loading without a skeleton. */
export function Loading({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.loading, style]} accessibilityLabel="Loading" accessible>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
}

/** Footer for infinite lists: spinner, or a retry row when the next page failed. */
export function ListFooter({ loading, error, onRetry, end }: { loading?: boolean; error?: ApiError | null; onRetry?: () => void; end?: string }) {
  if (loading) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>{error.message}</Text>
        {onRetry ? <Button label="Retry" onPress={onRetry} size="sm" variant="outline" /> : null}
      </View>
    );
  }
  if (end) {
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>{end}</Text>
      </View>
    );
  }
  return <View style={styles.footerSpace} />;
}

/** Inline banner (info / warning / error / success). */
export function Notice({
  tone = 'info',
  icon,
  title,
  message,
  style,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  icon?: IconName;
  title?: string;
  message: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = {
    info: { bg: Colors.primaryTint, fg: Colors.primary, icon: 'information-circle' as IconName },
    warning: { bg: Colors.warningTint, fg: Colors.warning, icon: 'time' as IconName },
    danger: { bg: Colors.dangerTint, fg: Colors.danger, icon: 'alert-circle' as IconName },
    success: { bg: Colors.successTint, fg: Colors.success, icon: 'checkmark-circle' as IconName },
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: t.bg }, style]} accessibilityRole="alert">
      <Ionicons name={icon ?? t.icon} size={18} color={t.fg} style={styles.noticeIcon} />
      <View style={styles.flex}>
        {title ? <Text style={[styles.noticeTitle, { color: t.fg }]}>{title}</Text> : null}
        <Text style={styles.noticeText}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  compact: { paddingVertical: Spacing.xl },
  artWrap: { backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: { ...Type.subheading, color: Colors.ink, textAlign: 'center' },
  message: { ...Type.body, color: Colors.muted, textAlign: 'center', maxWidth: 320 },
  action: { marginTop: Spacing.sm, alignSelf: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  footer: { paddingVertical: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  footerText: { ...Type.caption, color: Colors.muted, textAlign: 'center' },
  footerSpace: { height: Spacing.lg },
  notice: { flexDirection: 'row', borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  noticeIcon: { marginTop: 1 },
  noticeTitle: { ...Type.small, fontWeight: '600', marginBottom: 2 },
  noticeText: { ...Type.small, color: Colors.body },
});
