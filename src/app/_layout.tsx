import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppGate } from '@/components/app/AppGate';
import { useSession } from '@/stores/session';
import { Colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * Root stack. `index` restores the session and routes to welcome / onboarding /
 * enrolment-pending / tabs. AppGate overlays maintenance and update-required.
 */
export default function RootLayout() {
  const status = useSession((s) => s.status);
  const bootError = useSession((s) => s.bootError);

  useEffect(() => {
    if (status !== 'booting' || bootError) SplashScreen.hideAsync().catch(() => undefined);
  }, [status, bootError]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="enrolment-pending" options={{ animation: 'fade', gestureEnabled: false }} />
        </Stack>
        <AppGate />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
});
