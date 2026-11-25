import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar, Touchable } from '@/components/ui';
import { Colors, Radius, Spacing, Type } from '@/theme';

/** Square thumbnail for a draft photo, with optional order badge, remove button and upload progress. */
export function PhotoThumb({
  uri,
  size,
  order,
  onRemove,
  onPress,
  progress,
  failed,
  label,
}: {
  uri: string;
  size: number;
  order?: number;
  onRemove?: () => void;
  onPress?: () => void;
  progress?: number;
  failed?: string;
  label?: string;
}) {
  const body = (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image source={{ uri }} style={styles.img} contentFit="cover" transition={120} />
      {order ? (
        <View style={styles.order}>
          <Text style={styles.orderText}>{order}</Text>
        </View>
      ) : null}
      {onRemove ? (
        <Touchable onPress={onRemove} scaleTo={0.9} hitSlop={6} style={styles.remove} accessibilityLabel={`Remove ${label ?? 'photo'}`}>
          <Ionicons name="close" size={14} color={Colors.white} />
        </Touchable>
      ) : null}
      {failed ? (
        <View style={styles.failed}>
          <Ionicons name="alert-circle" size={18} color={Colors.white} />
        </View>
      ) : progress !== undefined && progress > 0 && progress < 1 ? (
        <View style={styles.progress}>
          <ProgressBar value={progress} colour={Colors.white} height={4} />
        </View>
      ) : progress === 1 ? (
        <View style={styles.done}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
        </View>
      ) : null}
    </View>
  );
  if (onPress) {
    return (
      <Touchable onPress={onPress} accessibilityLabel={label ?? 'Photo'}>
        {body}
      </Touchable>
    );
  }
  return body;
}

/** Dashed "add" tile. */
export function AddTile({ size, label, icon = 'add', onPress }: { size: number; label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Touchable onPress={onPress} accessibilityLabel={label} style={[styles.add, { width: size, height: size }]}>
      <Ionicons name={icon} size={22} color={Colors.primary} />
      <Text style={styles.addText} numberOfLines={2}>
        {label}
      </Text>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.skeleton },
  img: { width: '100%', height: '100%' },
  order: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: { ...Type.micro, color: Colors.white, fontWeight: '700' },
  remove: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.imageScrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { position: 'absolute', left: Spacing.xs, right: Spacing.xs, bottom: Spacing.xs },
  failed: { ...StyleSheet.absoluteFill, backgroundColor: Colors.imageScrim, alignItems: 'center', justifyContent: 'center' },
  done: { position: 'absolute', right: Spacing.xs, bottom: Spacing.xs },
  add: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primarySoft,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: Spacing.xs,
  },
  addText: { ...Type.micro, color: Colors.primary, textAlign: 'center' },
});
