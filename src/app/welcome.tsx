import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroArt } from '@/components/auth/AuthArt';
import { Button, Logo } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { go } from '@/lib/nav';
import { Colors, Illustrations, MaxContentWidth, Spacing, Type, type IllustrationKey } from '@/theme';

type Slide = { key: string; art: IllustrationKey; title: string; highlight: string; text: string };

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    art: 'students',
    title: 'Welcome to',
    highlight: 'ActiveSchool',
    text: 'Join activities, earn points, make new friends and become a healthier, happier you!',
  },
  {
    key: 'share',
    art: 'football',
    title: 'Share your',
    highlight: 'Sports Moments',
    text: 'Post your matches, practice and wins. Your class cheers you on and your coach verifies it.',
  },
  {
    key: 'win',
    art: 'basketball',
    title: 'Win Points &',
    highlight: 'Rewards',
    text: 'Take on challenges, join events and climb the leaderboard to win exciting rewards.',
  },
];

/** First screen for signed-out students: a short swipeable intro. */
export default function Welcome() {
  const { width, height } = useLayout();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Slide>>(null);
  const pageWidth = Math.min(width, MaxContentWidth);
  const art = Math.min(pageWidth * 0.78, height * 0.4, 340);
  const last = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (last) go('/phone');
    else list.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.top, { width: pageWidth }]}>
        <Logo height={26} />
        {!last ? <Button label="Skip" variant="ghost" size="sm" onPress={() => go('/phone')} /> : <View />}
      </View>

      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(s) => s.key}
        style={[styles.pager, { width: pageWidth }]}
        getItemLayout={(_, i) => ({ length: pageWidth, offset: pageWidth * i, index: i })}
        renderItem={({ item, index: i }) => (
          <View style={[styles.slide, { width: pageWidth }]}>
            <HeroArt source={Illustrations[item.art]} size={art} label={item.highlight} />
            <Animated.View entering={i === 0 ? FadeInDown.delay(150).duration(400) : undefined} style={styles.copy}>
              <Text style={styles.title} accessibilityRole="header">
                {item.title}
                {'\n'}
                <Text style={styles.highlight}>{item.highlight}</Text>
              </Text>
              <Text style={styles.subtitle}>{item.text}</Text>
            </Animated.View>
          </View>
        )}
      />

      <View style={[styles.bottom, { width: pageWidth }]}>
        <View style={styles.dots} accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
        <Button label={last ? 'Get Started' : 'Next'} iconRight="arrow-forward" onPress={next} />
        <Text style={styles.signin}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => go('/phone')} accessibilityRole="link">
            Log In
          </Text>
        </Text>
        <Text style={styles.legal}>
          By continuing you agree to the{' '}
          <Text style={styles.link} onPress={() => go('/pages/terms')} accessibilityRole="link">
            Terms
          </Text>{' '}
          and{' '}
          <Text style={styles.link} onPress={() => go('/pages/privacy')} accessibilityRole="link">
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, minHeight: 48 },
  pager: { flexGrow: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  copy: { gap: Spacing.sm },
  title: { ...Type.display, fontSize: 26, lineHeight: 34, color: Colors.ink, textAlign: 'center' },
  highlight: { color: Colors.primary },
  subtitle: { ...Type.bodyLg, color: Colors.muted, textAlign: 'center' },
  bottom: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, gap: Spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primarySoft },
  dotOn: { width: 22, backgroundColor: Colors.primary },
  signin: { ...Type.body, color: Colors.muted, textAlign: 'center' },
  legal: { ...Type.caption, color: Colors.subtle, textAlign: 'center' },
  link: { color: Colors.primary, fontWeight: '600' },
});
