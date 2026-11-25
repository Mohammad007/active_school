import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { APP_VERSION } from '@/api';
import { contentWidth, Header, ListRow, Screen, Section } from '@/components/ui';
import { go, goReplace } from '@/lib/nav';
import { useSession } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';

const LANGUAGES: Record<string, string> = { en: 'English', hi: 'हिन्दी' };

export default function SettingsScreen() {
  const me = useSession((s) => s.me);
  const config = useSession((s) => s.config);
  const signOut = useSession((s) => s.signOut);
  const [busy, setBusy] = useState(false);

  const language = me?.student?.preferences?.language ?? 'en';

  const logout = (all: boolean) => {
    Alert.alert(
      all ? 'Log out of all devices?' : 'Log out?',
      all ? 'You will be signed out on every phone and tablet, including this one.' : 'You can sign back in with your phone number.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: all ? 'Log out everywhere' : 'Log out',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            await signOut({ all });
            setBusy(false);
            goReplace('/welcome');
          },
        },
      ],
    );
  };

  const supportEmail = config?.support?.email;
  const supportPhone = config?.support?.phone;

  return (
    <Screen>
      <Header title="Settings" />
      <ScrollView contentContainerStyle={[styles.content, contentWidth]} showsVerticalScrollIndicator={false}>
        <Section title="Account">
          <ListRow icon="person-outline" title="Edit profile" onPress={() => go('/profile-edit')} last />
        </Section>

        <Section title="Preferences">
          <ListRow icon="shield-checkmark-outline" title="Privacy" onPress={() => go('/settings/privacy')} />
          <ListRow icon="notifications-outline" title="Notifications" onPress={() => go('/settings/notifications')} />
          <ListRow icon="language-outline" title="Language" value={LANGUAGES[language] ?? 'English'} onPress={() => go('/settings/language')} />
          <ListRow icon="ban-outline" title="Blocked accounts" onPress={() => go('/settings/blocked')} last />
        </Section>

        <Section title="Support">
          <ListRow icon="help-circle-outline" title="Help & FAQs" onPress={() => go('/settings/help')} />
          <ListRow icon="bug-outline" title="Report a problem" onPress={() => go('/settings/report')} />
          <ListRow icon="medkit-outline" title="Account recovery" onPress={() => go('/settings/account-recovery')} last />
        </Section>

        <Section title="Legal">
          <ListRow icon="document-text-outline" title="Terms of use" onPress={() => go('/pages/terms')} />
          <ListRow icon="lock-closed-outline" title="Privacy policy" onPress={() => go('/pages/privacy')} last />
        </Section>

        <Section>
          <ListRow icon="log-out-outline" title="Log out" onPress={() => !busy && logout(false)} chevron={false} />
          <ListRow icon="phone-portrait-outline" title="Log out of all devices" onPress={() => !busy && logout(true)} chevron={false} />
          <ListRow icon="trash-outline" title="Delete account" destructive onPress={() => go('/settings/delete-account')} last />
        </Section>

        <View style={styles.footer}>
          {me?.user.phone ? <Text style={styles.footerText}>Signed in as +91 {me.user.phone}</Text> : null}
          {supportEmail ? (
            <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${supportEmail}`)} accessibilityRole="link">
              {supportEmail}
            </Text>
          ) : null}
          {supportPhone ? (
            <Text style={styles.link} onPress={() => Linking.openURL(`tel:${supportPhone}`)} accessibilityRole="link">
              {supportPhone}
            </Text>
          ) : null}
          <Text style={styles.footerText}>ActiveSchool · version {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, gap: Spacing.xl, paddingBottom: Spacing.xxxl },
  footer: { alignItems: 'center', gap: Spacing.xs },
  footerText: { ...Type.caption, color: Colors.muted },
  link: { ...Type.small, color: Colors.primary, fontWeight: '500', paddingVertical: Spacing.xs },
});
