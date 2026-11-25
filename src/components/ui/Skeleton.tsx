import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Colors, Radius, ScreenPadding, Spacing } from '@/theme';

import { contentWidth } from './Screen';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Pulsing placeholder block. */
export function Skeleton({ width = '100%', height = 14, radius = Radius.sm, style }: SkeletonProps) {
  const pulse = useSharedValue(0.55);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: Colors.skeleton }, animated, style]} />;
}

/** Feed card placeholder. */
export function PostSkeleton() {
  return (
    <View style={styles.post} accessibilityLabel="Loading" accessible>
      <View style={styles.row}>
        <Skeleton width={36} height={36} radius={18} />
        <View style={styles.flex}>
          <Skeleton width="45%" height={12} />
          <Skeleton width="30%" height={10} style={styles.mt6} />
        </View>
      </View>
      <View style={styles.square}>
        <Skeleton height="100%" radius={0} />
      </View>
      <View style={styles.pad}>
        <Skeleton width="35%" height={12} />
        <Skeleton width="85%" height={12} style={styles.mt8} />
      </View>
    </View>
  );
}

/** List of row placeholders. */
export function ListSkeleton({ rows = 6, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <View style={[styles.list, contentWidth]} accessibilityLabel="Loading" accessible>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.listRow}>
          {avatar ? <Skeleton width={40} height={40} radius={20} /> : null}
          <View style={styles.flex}>
            <Skeleton width={`${60 - (i % 3) * 10}%`} height={12} />
            <Skeleton width={`${80 - (i % 2) * 20}%`} height={10} style={styles.mt8} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Card placeholders (challenges, events, goals). */
export function CardSkeleton({ count = 3, height = 120 }: { count?: number; height?: number }) {
  return (
    <View style={[styles.cards, contentWidth]} accessibilityLabel="Loading" accessible>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} radius={Radius.lg} />
      ))}
    </View>
  );
}

/** Square tile grid placeholder. */
export function GridSkeleton({ columns = 3, rows = 2, gap = 2 }: { columns?: number; rows?: number; gap?: number }) {
  return (
    <View style={[styles.grid, { gap }]}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <View key={i} style={{ width: `${100 / columns - 1}%`, aspectRatio: 1 }}>
          <Skeleton height="100%" radius={0} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: Spacing.sm },
  post: { backgroundColor: Colors.surface, marginBottom: Spacing.sm, paddingBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  square: { width: '100%', aspectRatio: 1 },
  pad: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  list: { padding: ScreenPadding, gap: Spacing.lg },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cards: { padding: ScreenPadding, gap: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
