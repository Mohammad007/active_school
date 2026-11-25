import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/stores/session';
import { Colors, Radius, Shadows } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(on: IconName, off: IconName) {
  function TabIcon({ focused }: { focused: boolean }) {
    return <Ionicons name={focused ? on : off} size={24} color={focused ? Colors.primary : Colors.subtle} />;
  }
  return TabIcon;
}

/** Raised round "+" button in the middle of the tab bar. */
function CreateIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.create, focused && styles.createOn]}>
      <Ionicons name="add" size={30} color={Colors.white} />
    </View>
  );
}

/** Five tabs: Home, Explore, Create, Ranks, Profile. Only reachable when fully enrolled. */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const status = useSession((s) => s.status);
  const gate = useSession((s) => s.gate);

  if (status === 'booting') return <Redirect href="/" />;
  if (status === 'signedOut') return <Redirect href="/welcome" />;
  if (status === 'ready' && gate === 'onboarding_required') return <Redirect href="/select-school" />;
  if (status === 'ready' && gate) return <Redirect href={'/enrolment-pending' as never} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.subtle,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.bar, { height: 66 + insets.bottom, paddingBottom: Math.max(insets.bottom, 10) }],
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        animation: 'fade',
      }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('compass', 'compass-outline') }} />
      <Tabs.Screen
        name="create"
        options={{ title: 'Create', tabBarIcon: CreateIcon, tabBarAccessibilityLabel: 'Create activity', tabBarLabel: () => null }}
      />
      <Tabs.Screen name="leaderboard" options={{ title: 'Ranks', tabBarIcon: icon('podium', 'podium-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-circle', 'person-circle-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    elevation: 0,
    overflow: 'visible',
  },
  // Explicit line height: without it the label box is shorter than the glyphs and descenders clip.
  label: { fontSize: 11, lineHeight: 16, fontWeight: '600', paddingBottom: 1 },
  create: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    borderColor: Colors.surface,
    ...Shadows.raised,
  },
  createOn: { backgroundColor: Colors.primaryDark },
});
