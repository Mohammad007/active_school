import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/theme';
import type { Media } from '@/types';

/**
 * Instagram-style swipeable photo carousel with dots and an "n/N" counter.
 * Sizes itself to its container width; aspect is clamped between 4:5 and 1.91:1
 * using the first photo's dimensions (square when unknown).
 */
export function PhotoCarousel({
  photos,
  onPress,
  onDoublePress,
  title,
}: {
  photos: Media[];
  onPress?: () => void;
  onDoublePress?: () => void;
  title?: string;
}) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const first = photos[0];
  const ratio = first?.width && first?.height ? Math.max(0.8, Math.min(1.91, first.width / first.height)) : 1;
  const height = width ? width / ratio : 0;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  const handlePress = () => {
    const now = Date.now();
    if (onDoublePress && now - lastTap < 280) {
      onDoublePress();
      setLastTap(0);
      return;
    }
    setLastTap(now);
    if (onPress) setTimeout(() => onPress(), onDoublePress ? 290 : 0);
  };

  if (!photos.length) return null;

  return (
    <View onLayout={onLayout} style={[styles.wrap, { height: height || undefined, aspectRatio: width ? undefined : ratio }]}>
      {width > 0 ? (
        <FlatList
          data={photos}
          keyExtractor={(p) => String(p.id)}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item, index: i }) => (
            <Pressable
              onPress={handlePress}
              accessibilityRole="imagebutton"
              accessibilityLabel={`${title ? `${title}, ` : ''}photo ${i + 1} of ${photos.length}`}>
              <Image
                source={{ uri: item.url ?? item.thumb_url }}
                placeholder={item.url ? { uri: item.thumb_url } : undefined}
                style={{ width, height }}
                contentFit="cover"
                transition={180}
                recyclingKey={String(item.id)}
              />
            </Pressable>
          )}
        />
      ) : null}
      {photos.length > 1 ? (
        <>
          <View style={styles.counter} pointerEvents="none">
            <Text style={styles.counterText}>
              {index + 1}/{photos.length}
            </Text>
          </View>
          <View style={styles.dots} pointerEvents="none">
            {photos.map((p, i) => (
              <View key={p.id} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: Colors.skeleton, overflow: 'hidden' },
  counter: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.imageScrim,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  counterText: { ...Type.micro, color: Colors.white, fontWeight: '600' },
  dots: { position: 'absolute', bottom: Spacing.sm + 2, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.dotInactive },
  dotOn: { backgroundColor: Colors.white },
});
