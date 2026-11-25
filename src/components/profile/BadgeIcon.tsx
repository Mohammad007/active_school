import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { iconName } from '@/lib/icons';
import { Colors, safeColour, tint } from '@/theme';

/** Points of a pointy-top hexagon inside a size×size box, inset by `pad`. */
function hexagon(size: number, pad: number) {
  const r = size / 2 - pad;
  const c = size / 2;
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/**
 * Hexagon badge using the API icon + colour. Earned badges are filled in the
 * badge colour; locked ones stay a faded tint of it with a small lock.
 */
export function BadgeIcon({ icon, colour, size = 56, locked }: { icon: string | null; colour: string | null; size?: number; locked?: boolean }) {
  const c = safeColour(colour);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Polygon points={hexagon(size, 1)} fill={locked ? tint(c, 0.12) : c} />
        <Polygon points={hexagon(size, size * 0.1)} fill={locked ? Colors.surface : tint(Colors.white, 0.18)} stroke={locked ? tint(c, 0.3) : tint(Colors.white, 0.5)} strokeWidth={1.5} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Ionicons name={iconName(icon)} size={size * 0.42} color={locked ? tint(c, 0.55) : Colors.white} />
      </View>
      {locked ? (
        <View style={[styles.lock, { width: size * 0.36, height: size * 0.36, borderRadius: size * 0.18 }]}>
          <Ionicons name="lock-closed" size={size * 0.2} color={Colors.muted} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  lock: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
