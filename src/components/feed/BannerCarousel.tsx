import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Skeleton, Touchable } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { openRoute } from '@/lib/nav';
import { Colors, Radius, ScreenPadding, Spacing, Type, safeColour } from '@/theme';
import type { Banner } from '@/types';

/** Horizontal, snapping banner cards (GET /banners). Tap follows the banner route. */
export function BannerCarousel({ banners, loading }: { banners: Banner[] | undefined; loading?: boolean }) {
  // Banners sit in wide (grid) screens, so they span the tablet width too.
  const { wideWidth } = useLayout();
  const [index, setIndex] = useState(0);
  const cardWidth = wideWidth - ScreenPadding * 2;
  const height = Math.round(Math.min(180, cardWidth * 0.38));

  if (loading && !banners) {
    return (
      <View style={styles.pad}>
        <Skeleton height={height} radius={Radius.lg} />
      </View>
    );
  }
  if (!banners?.length) return null;

  const step = cardWidth + Spacing.sm;

  return (
    <View>
      <FlatList
        data={banners}
        keyExtractor={(b) => String(b.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / step))}
        renderItem={({ item }) => {
          const bg = safeColour(item.colour, Colors.primary);
          return (
            <Touchable
              scaleTo={0.985}
              disabled={!item.route}
              onPress={() => openRoute(item.route)}
              accessibilityRole={item.route ? 'link' : 'image'}
              accessibilityLabel={[item.title, item.subtitle].filter(Boolean).join('. ')}
              style={[styles.card, { width: cardWidth, height, backgroundColor: bg }]}>
              {item.image_url ? (
                <>
                  <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  <View style={[StyleSheet.absoluteFill, styles.scrim]} />
                </>
              ) : null}
              <View style={styles.text}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              {item.route ? (
                <View style={styles.go}>
                  <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                </View>
              ) : null}
            </Touchable>
          );
        }}
      />
      {banners.length > 1 ? (
        <View style={styles.dots} importantForAccessibility="no-hide-descendants">
          {banners.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.md },
  list: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.md, gap: Spacing.sm },
  card: { borderRadius: Radius.lg, overflow: 'hidden', padding: Spacing.lg, justifyContent: 'flex-end' },
  scrim: { backgroundColor: Colors.overlay, opacity: 0.6 },
  text: { gap: Spacing.xs, paddingRight: Spacing.xxl },
  title: { ...Type.heading, color: Colors.white },
  subtitle: { ...Type.small, color: Colors.onPrimaryMuted },
  go: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.imageScrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.hairline },
  dotOn: { backgroundColor: Colors.primary, width: 14 },
});
