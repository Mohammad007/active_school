import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Logo } from '@/components/ui';
import { openUrl } from '@/lib/nav';
import { useSession, useUpdateRequired } from '@/stores/session';
import { Colors, MaxContentWidth, Spacing, Type } from '@/theme';

/**
 * Full-screen overlays that block the app: maintenance mode (GET /config or a
 * 503 `maintenance` error) and a minimum app version above this build.
 */
export function AppGate() {
  const maintenance = useSession((s) => s.maintenance);
  const config = useSession((s) => s.config);
  const updateRequired = useUpdateRequired();
  const [checking, setChecking] = useState(false);

  if (!maintenance && !updateRequired) return null;

  const retry = async () => {
    setChecking(true);
    try {
      const c = await useSession.getState().loadConfig();
      if (c && !c.maintenance?.enabled) useSession.setState({ maintenance: null });
    } catch {
      // still down
    } finally {
      setChecking(false);
    }
  };

  return (
    <Animated.View entering={FadeIn} style={StyleSheet.absoluteFill}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.body}>
          <Logo height={30} />
          <View style={styles.icon}>
            <Ionicons name={updateRequired ? 'arrow-up-circle-outline' : 'construct-outline'} size={30} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{updateRequired ? 'Update required' : 'We will be right back'}</Text>
          <Text style={styles.message}>
            {updateRequired
              ? 'This version of ActiveSchool is no longer supported. Please update the app from the store to continue.'
              : maintenance}
          </Text>
          {updateRequired ? (
            config?.links?.website ? <Button label="Open website" onPress={() => openUrl(config.links.website)} /> : null
          ) : (
            <Button label="Try again" onPress={retry} loading={checking} variant="secondary" />
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl },
  title: { ...Type.title, color: Colors.ink, textAlign: 'center' },
  message: { ...Type.bodyLg, color: Colors.muted, textAlign: 'center', marginBottom: Spacing.md },
});
