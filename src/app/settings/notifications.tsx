import { ScrollView, StyleSheet } from 'react-native';

import { usePreferences } from '@/components/settings/usePreferences';
import { contentWidth, Header, Screen, Section, SwitchRow } from '@/components/ui';
import { ScreenPadding, Spacing } from '@/theme';
import type { Preferences } from '@/types';

type Key = keyof Preferences['notifications'];

const TOPICS: { key: Exclude<Key, 'push'>; title: string; subtitle: string }[] = [
  { key: 'activities', title: 'Activities', subtitle: 'Reviews, appreciations and comments on your posts' },
  { key: 'challenges', title: 'Challenges', subtitle: 'New challenges and progress updates' },
  { key: 'events', title: 'Events', subtitle: 'Registrations, reminders and results' },
  { key: 'rewards', title: 'Rewards', subtitle: 'Winner announcements and claim updates' },
];

export default function NotificationSettingsScreen() {
  const { prefs, update } = usePreferences();
  const n = prefs.notifications;

  return (
    <Screen>
      <Header title="Notifications" />
      <ScrollView contentContainerStyle={[styles.content, contentWidth]}>
        <Section>
          <SwitchRow
            title="Push notifications"
            subtitle="Alerts on this device. In-app notifications are always kept."
            value={n.push}
            onChange={(v) => update({ notifications: { push: v } })}
            last
          />
        </Section>
        <Section title="Notify me about">
          {TOPICS.map((t, i) => (
            <SwitchRow
              key={t.key}
              title={t.title}
              subtitle={t.subtitle}
              value={n[t.key]}
              onChange={(v) => update({ notifications: { [t.key]: v } })}
              last={i === TOPICS.length - 1}
            />
          ))}
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, gap: Spacing.xl, paddingBottom: Spacing.xxl },
});
