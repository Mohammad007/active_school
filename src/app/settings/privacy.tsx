import { ScrollView, StyleSheet } from 'react-native';

import { RadioRow } from '@/components/settings/RadioRow';
import { usePreferences } from '@/components/settings/usePreferences';
import { contentWidth, Header, Notice, Screen, Section, SwitchRow } from '@/components/ui';
import { ScreenPadding, Spacing } from '@/theme';
import type { Preferences } from '@/types';

const VISIBILITY: { key: Preferences['privacy']['profile_visibility']; title: string; subtitle: string }[] = [
  { key: 'class', title: 'My class', subtitle: 'Classmates in your class can see your profile' },
  { key: 'school', title: 'My school', subtitle: 'Students across your school can see your profile' },
  { key: 'private', title: 'Only me', subtitle: 'Your profile is hidden from other students' },
];

export default function PrivacyScreen() {
  const { prefs, update } = usePreferences();
  const p = prefs.privacy;

  return (
    <Screen>
      <Header title="Privacy" />
      <ScrollView contentContainerStyle={[styles.content, contentWidth]}>
        <Section title="Who can see my profile">
          {VISIBILITY.map((v, i) => (
            <RadioRow
              key={v.key}
              title={v.title}
              subtitle={v.subtitle}
              selected={p.profile_visibility === v.key}
              onPress={() => p.profile_visibility !== v.key && update({ privacy: { profile_visibility: v.key } })}
              last={i === VISIBILITY.length - 1}
            />
          ))}
        </Section>
        <Section title="Activity">
          <SwitchRow
            title="Show me on the leaderboard"
            subtitle="When off, classmates see “Student” instead of your name. Your points still count."
            value={p.show_on_leaderboard}
            onChange={(v) => update({ privacy: { show_on_leaderboard: v } })}
          />
          <SwitchRow
            title="Allow tagging"
            subtitle="Let classmates mention you in their activities"
            value={p.allow_tagging}
            onChange={(v) => update({ privacy: { allow_tagging: v } })}
            last
          />
        </Section>
        <Notice message="Your date of birth, phone, guardian details and evidence are never shown to other students." />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, gap: Spacing.xl, paddingBottom: Spacing.xxl },
});
