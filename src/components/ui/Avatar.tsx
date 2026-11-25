import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { initials } from '@/lib/format';
import { Characters, Colors } from '@/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  /** Brand ring (e.g. own profile). */
  ring?: boolean;
  /** Show a drawn character instead of initials when there is no photo. */
  character?: keyof typeof Characters | null;
}

/** Which drawn character fits a gender (onboarding / profile placeholders). */
export function characterFor(gender?: string | null): keyof typeof Characters {
  return gender === 'girl' || gender === 'F' ? 'girl' : 'boy';
}

/** Round avatar from a signed URL, with a drawn-character or initials fallback. */
export function Avatar({ uri, name, size = 40, ring, character }: AvatarProps) {
  const inner = ring ? size - 6 : size;
  const body = uri || character ? (
    <Image
      source={uri ? { uri } : Characters[character!]}
      style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: Colors.skeleton }}
      contentFit="cover"
      transition={150}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View style={[styles.fallback, { width: inner, height: inner, borderRadius: inner / 2 }]}>
      <Text style={[styles.initials, { fontSize: Math.max(11, inner * 0.36) }]}>{initials(name)}</Text>
    </View>
  );

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name ? `${name} profile photo` : 'Profile photo'}
      style={[{ width: size, height: size, borderRadius: size / 2 }, ring && styles.ring]}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  fallback: { backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.primary, fontWeight: '700' },
});
