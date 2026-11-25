import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Brand, Colors, Radius, Spacing, Type } from '@/theme';

/** Website wordmark (navy/amber, or white for dark backgrounds). */
export function Logo({ variant = 'color', height = 28, style }: { variant?: 'color' | 'white'; height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel="ActiveSchool">
      <Image
        source={variant === 'white' ? Brand.logoWhite : Brand.logo}
        style={{ height, width: height * Brand.logoAspect }}
        contentFit="contain"
      />
    </View>
  );
}

/** Animated progress bar (value 0..1). */
export function ProgressBar({ value, colour = Colors.primary, height = 6, style }: { value: number; colour?: string; height?: number; style?: StyleProp<ViewStyle> }) {
  const v = useSharedValue(0);
  const clamped = Math.max(0, Math.min(1, value || 0));
  useEffect(() => {
    v.value = withTiming(clamped, { duration: 450 });
  }, [clamped, v]);
  const animated = useAnimatedStyle(() => ({ width: `${v.value * 100}%` }));
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <Animated.View style={[styles.fill, { backgroundColor: colour, borderRadius: height / 2 }, animated]} />
    </View>
  );
}

/** Section title with optional trailing action text. */
export function SectionTitle({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {action && onAction ? (
        <Text style={styles.sectionAction} onPress={onAction} accessibilityRole="link" suppressHighlighting>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

/** Vertical step tracker (event points status, reward claim tracking). */
export function Steps({ steps, current, failed }: { steps: { title: string; caption?: string | null }[]; current: number; failed?: boolean }) {
  return (
    <View>
      {steps.map((s, i) => {
        const done = i < current || (i === current && !failed && i === steps.length - 1);
        const active = i === current;
        const colour = failed && active ? Colors.danger : done || active ? Colors.primary : Colors.hairline;
        return (
          <View key={`${s.title}-${i}`} style={styles.step} accessible accessibilityLabel={`${s.title}${done ? ', done' : active ? ', current step' : ''}`}>
            <View style={styles.stepRail}>
              <View style={[styles.stepDot, { borderColor: colour }, (done || active) && { backgroundColor: colour }]}>
                {done ? <Text style={styles.stepTick}>✓</Text> : null}
              </View>
              {i < steps.length - 1 ? <View style={[styles.stepLine, i < current && { backgroundColor: Colors.primary }]} /> : null}
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, !(done || active) && { color: Colors.subtle }]}>{s.title}</Text>
              {s.caption ? <Text style={styles.stepCaption}>{s.caption}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: Colors.surfaceAlt, overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  sectionTitle: { ...Type.subheading, color: Colors.ink },
  sectionAction: { ...Type.small, fontWeight: '600', color: Colors.primary, paddingVertical: Spacing.sm, paddingLeft: Spacing.md },
  step: { flexDirection: 'row', gap: Spacing.md, minHeight: 52 },
  stepRail: { alignItems: 'center', width: 20 },
  stepDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  stepTick: { color: Colors.white, fontSize: 11, lineHeight: 13, fontWeight: '700' },
  stepLine: { flex: 1, width: 2, backgroundColor: Colors.hairline, marginVertical: 2, borderRadius: Radius.xs },
  stepBody: { flex: 1, paddingBottom: Spacing.md },
  stepTitle: { ...Type.body, fontWeight: '600', color: Colors.ink },
  stepCaption: { ...Type.caption, color: Colors.muted, marginTop: 2 },
});
