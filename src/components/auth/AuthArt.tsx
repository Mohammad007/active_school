import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Colors } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Small floating sports icons placed around a hero illustration. */
const DECOR: { icon: IconName; colour: string; top?: `${number}%`; left?: `${number}%`; right?: `${number}%`; bottom?: `${number}%`; size: number }[] = [
  { icon: 'trophy', colour: Colors.accent, top: '4%', left: '2%', size: 26 },
  { icon: 'star', colour: Colors.accent, top: '0%', right: '8%', size: 20 },
  { icon: 'football', colour: Colors.primary, bottom: '12%', left: '0%', size: 22 },
  { icon: 'medal', colour: Colors.success, top: '30%', right: '0%', size: 22 },
  { icon: 'basketball', colour: Colors.accent, bottom: '4%', right: '6%', size: 20 },
];

/**
 * A hand-drawn character on a soft brand blob, with floating sports icons.
 * `onDark` swaps the blob for a translucent white one (splash screen).
 */
export function HeroArt({
  source,
  size,
  onDark,
  decor = true,
  label,
  style,
}: {
  source: ImageSource | number;
  size: number;
  onDark?: boolean;
  decor?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ width: size, height: size }, styles.wrap, style]}>
      <Animated.View
        entering={ZoomIn.duration(450)}
        style={[
          styles.blob,
          { width: size * 0.86, height: size * 0.86, borderRadius: size * 0.43 },
          { backgroundColor: onDark ? Colors.whiteGlow : Colors.primaryTint },
        ]}
      />
      <Image source={source} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel={label} />
      {decor
        ? DECOR.map((d, i) => (
            <Animated.View
              key={d.icon}
              entering={FadeIn.delay(250 + i * 90).duration(350)}
              style={[styles.decor, { top: d.top, left: d.left, right: d.right, bottom: d.bottom }]}
              importantForAccessibility="no-hide-descendants">
              <Ionicons name={d.icon} size={d.size} color={onDark ? Colors.white : d.colour} />
            </Animated.View>
          ))
        : null}
    </View>
  );
}

/** Round icon badge used at the top of auth screens (phone, lock…). */
export function AuthBadge({ icon, secondary }: { icon: IconName; secondary?: IconName }) {
  return (
    <Animated.View entering={ZoomIn.duration(350)} style={styles.badgeWrap}>
      <View style={styles.badge}>
        <Ionicons name={icon} size={44} color={Colors.primary} />
      </View>
      {secondary ? (
        <View style={styles.badgeSmall}>
          <Ionicons name={secondary} size={18} color={Colors.white} />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  blob: { position: 'absolute' },
  decor: { position: 'absolute' },
  badgeWrap: { alignSelf: 'center', width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  badgeSmall: {
    position: 'absolute',
    right: 4,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
