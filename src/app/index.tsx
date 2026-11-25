import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroArt } from '@/components/auth/AuthArt';
import { Button, Logo } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { homeRoute, useSession } from '@/stores/session';
import { Colors, Illustrations, Spacing, Type } from '@/theme';

/** Splash + session restore: config → token → /me → route. */
export default function Splash() {
  const status = useSession((s) => s.status);
  const bootError = useSession((s) => s.bootError);
  const restore = useSession((s) => s.restore);
  const { width, height } = useLayout();
  const art = Math.min(width * 0.8, height * 0.38, 340);

  useEffect(() => {
    if (useSession.getState().status === 'booting') restore();
  }, [restore]);

  useEffect(() => {
    if (status !== 'booting') router.replace(homeRoute());
  }, [status]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      {/* soft background rings */}
      <View style={[styles.ring, styles.ringTop]} />
      <View style={[styles.ring, styles.ringBottom]} />

      <Animated.View entering={FadeIn.duration(300)} style={styles.center}>
        <Logo variant="white" height={40} />
        <Text style={styles.tagline}>Learn · Participate · Achieve · Grow</Text>

        <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.art}>
          <HeroArt source={Illustrations.students} size={art} onDark label="Two students waving" />
        </Animated.View>

        {bootError ? (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>Can’t reach ActiveSchool</Text>
            <Text style={styles.errorText}>{bootError.message}</Text>
            <Button label="Try again" onPress={restore} variant="outline" size="sm" />
          </View>
        ) : (
          <ActivityIndicator color={Colors.white} style={styles.spinner} />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.primary, overflow: 'hidden' },
  ring: { position: 'absolute', borderRadius: 999, backgroundColor: Colors.whiteGlow },
  ringTop: { width: 320, height: 320, top: -120, right: -110 },
  ringBottom: { width: 260, height: 260, bottom: -90, left: -100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  tagline: { ...Type.small, color: Colors.onPrimaryMuted, marginTop: Spacing.sm, letterSpacing: 0.3 },
  art: { marginTop: Spacing.xl },
  spinner: { marginTop: Spacing.xl },
  error: { marginTop: Spacing.lg, alignItems: 'center', gap: Spacing.sm, maxWidth: 360 },
  errorTitle: { ...Type.heading, color: Colors.white },
  errorText: { ...Type.body, color: Colors.onPrimaryMuted, textAlign: 'center', marginBottom: Spacing.sm },
});
