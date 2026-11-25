import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { iconName } from '@/lib/icons';
import { Colors, Illustrations, Radius, Spacing, tint, type IllustrationKey } from '@/theme';

/**
 * Illustrated banner used when a challenge or event has no uploaded image:
 * a drawn character on a tinted card with soft circles and the category icon.
 */
export function ArtHero({
  art,
  colour,
  icon,
  label,
  style,
}: {
  art: IllustrationKey;
  colour: string;
  icon?: string | null;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.hero, { backgroundColor: tint(colour, 0.12) }, style]} accessible accessibilityRole="image" accessibilityLabel={label}>
      <View style={[styles.circle, styles.circleA, { backgroundColor: tint(colour, 0.12) }]} />
      <View style={[styles.circle, styles.circleB, { backgroundColor: tint(colour, 0.1) }]} />
      <Image source={Illustrations[art]} style={styles.art} contentFit="contain" accessibilityIgnoresInvertColors />
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colour }]}>
          <Ionicons name={iconName(icon, 'flag')} size={22} color={Colors.white} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', aspectRatio: 16 / 9, maxHeight: 320, borderRadius: Radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', borderRadius: 999 },
  circleA: { width: 220, height: 220, top: -80, right: -60 },
  circleB: { width: 160, height: 160, bottom: -70, left: -40 },
  art: { width: '78%', height: '90%' },
  icon: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});
