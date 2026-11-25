import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { publicApi } from '@/api';
import { StepIntro } from '@/components/auth/OnboardingParts';
import {
  Avatar,
  Button,
  Card,
  characterFor,
  ChipGroup,
  EmptyState,
  ErrorState,
  FieldError,
  FieldLabel,
  FormScroll,
  Header,
  Screen,
  Skeleton,
  TextField,
} from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { maskDateInput, parseUserDate } from '@/lib/format';
import { go, goReplace } from '@/lib/nav';
import { useOnboarding } from '@/stores/onboarding';
import { Colors, Spacing, Type } from '@/theme';
import type { Gender } from '@/types';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'boy', label: 'Boy' },
  { key: 'girl', label: 'Girl' },
  { key: 'self_describe', label: 'Self-describe' },
  { key: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/** Onboarding step 2: class, name, date of birth, gender. Students sign up on their own. */
export default function StudentDetails() {
  const d = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schoolId = d.school?.id ?? 0;
  // Read the id outside the closure: the React Compiler hoists `d.school!.id` and crashes when no school is picked.
  const classes = useQuery(() => publicApi.classes(schoolId), [schoolId], { enabled: schoolId > 0 });

  if (!d.school) {
    return (
      <Screen>
        <Header title="Your details" />
        <EmptyState art="students" title="Pick your school first" actionLabel="Choose school" onAction={() => goReplace('/select-school')} />
      </Screen>
    );
  }

  const next = () => {
    const e: Record<string, string> = {};
    if (!d.schoolClass) e.class_id = 'Pick your class.';
    if (d.fullName.trim().length < 2) e.full_name = 'Enter your full name as in school records.';
    if (d.displayName.trim().length < 2) e.display_name = 'Enter a display name (2–40 characters).';
    const dob = parseUserDate(d.dob);
    if (!dob) e.dob = 'Enter your date of birth as DD/MM/YYYY.';
    else {
      const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 86400000);
      if (age < 3 || age > 25) e.dob = 'Check the year of your date of birth.';
    }
    if (!d.gender) e.gender = 'Choose an option.';
    setErrors(e);
    if (Object.keys(e).length) return;
    go('/complete-profile');
  };

  return (
    <Screen background={Colors.surface}>
      <Header title="Your details" />
      <FormScroll footer={<Button label="Continue" onPress={next} />}>
        <StepIntro step={2} title="Your Details" subtitle="Tell us a bit about yourself. Only your display name and class are shown to classmates." />
        <View style={styles.hero}>
          <Avatar uri={d.avatarUri} character={characterFor(d.gender)} name={d.displayName || d.fullName} size={104} ring />
        </View>

        <Card style={styles.school}>
          <Text style={styles.schoolLabel}>School</Text>
          <Text style={styles.schoolName}>{d.school.name}</Text>
          <Text style={styles.change} onPress={() => go('/select-school')} accessibilityRole="link">
            Change
          </Text>
        </Card>

        <View style={styles.field}>
          <FieldLabel>Class</FieldLabel>
          {classes.loading ? (
            <View style={styles.row}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} width={84} height={36} radius={18} />
              ))}
            </View>
          ) : classes.error ? (
            <ErrorState error={classes.error} onRetry={classes.reload} compact />
          ) : classes.data?.length ? (
            <ChipGroup
              options={classes.data.map((c) => ({ key: c.id, label: c.label }))}
              selected={d.schoolClass ? [d.schoolClass.id] : []}
              onToggle={(id) => d.set({ schoolClass: classes.data?.find((c) => c.id === id) ?? null })}
            />
          ) : (
            <Text style={styles.muted}>Your school has not added classes yet. Contact your school, then try again.</Text>
          )}
          <FieldError>{errors.class_id}</FieldError>
        </View>

        <TextField
          label="Full name"
          placeholder="As in school records"
          autoCapitalize="words"
          textContentType="name"
          value={d.fullName}
          onChangeText={(v) => d.set({ fullName: v })}
          maxLength={120}
          error={errors.full_name}
        />
        <TextField
          label="Display name"
          placeholder="What classmates see"
          hint="Shown on your posts and the leaderboard."
          value={d.displayName}
          onChangeText={(v) => d.set({ displayName: v })}
          maxLength={40}
          error={errors.display_name}
        />
        <TextField
          label="Date of birth"
          placeholder="DD/MM/YYYY"
          keyboardType="number-pad"
          value={d.dob}
          onChangeText={(v) => d.set({ dob: maskDateInput(v) })}
          maxLength={10}
          hint="Private — never shown to classmates."
          error={errors.dob}
        />

        <View style={styles.field}>
          <FieldLabel>Gender</FieldLabel>
          <ChipGroup options={GENDERS} selected={d.gender ? [d.gender] : []} onToggle={(g) => d.set({ gender: g })} />
          <FieldError>{errors.gender}</FieldError>
        </View>
        {d.gender === 'self_describe' ? (
          <TextField label="How do you describe yourself?" optional value={d.genderLabel} onChangeText={(v) => d.set({ genderLabel: v })} maxLength={40} />
        ) : null}

      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.sm },
  hero: { alignItems: 'center', paddingVertical: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.sm },
  school: { padding: Spacing.md, gap: 2 },
  schoolLabel: { ...Type.caption, color: Colors.muted },
  schoolName: { ...Type.body, fontWeight: '600', color: Colors.ink, paddingRight: 64 },
  change: { ...Type.small, fontWeight: '600', color: Colors.primary, position: 'absolute', right: Spacing.md, top: Spacing.md, padding: Spacing.xs },
  muted: { ...Type.small, color: Colors.muted },
});
