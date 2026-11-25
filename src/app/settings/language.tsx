import { ScrollView, StyleSheet } from 'react-native';

import { RadioRow } from '@/components/settings/RadioRow';
import { usePreferences } from '@/components/settings/usePreferences';
import { contentWidth, Header, Notice, Screen, Section } from '@/components/ui';
import { ScreenPadding, Spacing } from '@/theme';

const OPTIONS: { key: 'en' | 'hi'; title: string; subtitle: string }[] = [
  { key: 'en', title: 'English', subtitle: 'English' },
  { key: 'hi', title: 'हिन्दी', subtitle: 'Hindi' },
];

export default function LanguageScreen() {
  const { prefs, update } = usePreferences();

  return (
    <Screen>
      <Header title="Language" />
      <ScrollView contentContainerStyle={[styles.content, contentWidth]}>
        <Section title="Preferred language">
          {OPTIONS.map((o, i) => (
            <RadioRow
              key={o.key}
              title={o.title}
              subtitle={o.subtitle}
              selected={prefs.language === o.key}
              onPress={() => prefs.language !== o.key && update({ language: o.key })}
              last={i === OPTIONS.length - 1}
            />
          ))}
        </Section>
        <Notice message="The app is currently shown in English. Your preferred language is saved to your account and used for messages from your school and ActiveSchool where available." />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, gap: Spacing.xl, paddingBottom: Spacing.xxl },
});
