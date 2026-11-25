import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Colors, Radius, Spacing, Type } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const CONFETTI: { icon: IconName; colour: string; top: `${number}%`; left: `${number}%`; size: number }[] = [
  { icon: 'star', colour: Colors.accent, top: '12%', left: '18%', size: 16 },
  { icon: 'sparkles', colour: Colors.primary, top: '8%', left: '74%', size: 18 },
  { icon: 'star', colour: Colors.primary, top: '52%', left: '10%', size: 12 },
  { icon: 'sparkles', colour: Colors.accent, top: '48%', left: '84%', size: 14 },
  { icon: 'ellipse', colour: Colors.success, top: '30%', left: '28%', size: 8 },
  { icon: 'ellipse', colour: Colors.heart, top: '24%', left: '66%', size: 8 },
];

/** Big trophy with confetti, for Rewards and celebratory headers. */
export function TrophyHero({ title, subtitle, icon = 'trophy' }: { title: string; subtitle?: string; icon?: IconName }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        {CONFETTI.map((c, i) => (
          <Animated.View key={i} entering={FadeIn.delay(150 + i * 60)} style={[styles.confetti, { top: c.top, left: c.left }]} importantForAccessibility="no-hide-descendants">
            <Ionicons name={c.icon} size={c.size} color={c.colour} />
          </Animated.View>
        ))}
        <Animated.View entering={ZoomIn.duration(400)} style={styles.trophy}>
          <Ionicons name={icon} size={64} color={Colors.gold} />
        </Animated.View>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.goldTint },
  stage: { width: 220, height: 120, alignItems: 'center', justifyContent: 'center' },
  confetti: { position: 'absolute' },
  trophy: { width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { ...Type.heading, color: Colors.ink, textAlign: 'center', paddingHorizontal: Spacing.lg },
  subtitle: { ...Type.small, color: Colors.muted, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
