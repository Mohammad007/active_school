import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { accountApi, ApiError, errorMessage, fieldErrors } from '@/api';
import { AvatarPicker, InterestsInput, StepIntro } from '@/components/auth/OnboardingParts';
import { Button, characterFor, FormScroll, Header, Notice, Screen, TextField } from '@/components/ui';
import { parseUserDate } from '@/lib/format';
import { go, goReplace } from '@/lib/nav';
import { FIELD_STEP, toOnboardingInput, useOnboarding } from '@/stores/onboarding';
import { homeRoute, useSession } from '@/stores/session';
import { Colors, Spacing, Type } from '@/theme';

/** Onboarding step 3: photo, bio, interests → POST /onboarding. */
export default function CompleteProfile() {
  const d = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stepErrors = Object.entries(errors).filter(([k]) => FIELD_STEP[k]);

  const finish = async () => {
    const dob = parseUserDate(d.dob);
    if (!d.school || !d.schoolClass || !dob) {
      Alert.alert('A few details are missing', 'Go back and complete your school and details first.', [
        { text: 'OK', onPress: () => go(d.school ? '/student-details' : '/select-school') },
      ]);
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      await accountApi.onboard(toOnboardingInput(d, dob));
      await useSession.getState().refreshMe();
      d.reset();
      goReplace(homeRoute() as string);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'already_enrolled') {
        await useSession.getState().refreshMe().catch(() => null);
        goReplace(homeRoute() as string);
        return;
      }
      const f = fieldErrors(e);
      if (Object.keys(f).length) setErrors(f);
      else Alert.alert('Could not finish setup', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen background={Colors.surface}>
      <Header title="Your profile" />
      <FormScroll footer={<Button label="Finish" onPress={finish} loading={busy} />}>
        <StepIntro step={3} title="Complete Your Profile" subtitle="Add a photo and a few more details to get started. You can change these later." />

        {stepErrors.length ? (
          <View style={styles.errors}>
            <Notice tone="danger" title="Please fix these" message={stepErrors.map(([k, m]) => `${FIELD_STEP[k].label}: ${m}`).join('\n')} />
            <Button
              label="Go to details"
              variant="outline"
              size="sm"
              onPress={() => go(FIELD_STEP[stepErrors[0][0]].path)}
            />
          </View>
        ) : null}

        <AvatarPicker
          uri={d.avatarUri}
          name={d.displayName || d.fullName}
          character={characterFor(d.gender)}
          onUploaded={(id, uri) => d.set({ avatarMediaId: id, avatarUri: uri })}
          onRemove={() => d.set({ avatarMediaId: null, avatarUri: null })}
        />
        {errors.avatar_media_id ? <Text style={styles.error}>{errors.avatar_media_id}</Text> : null}

        <TextField
          label="Bio"
          optional
          placeholder="e.g. Captain of the U-14 football team"
          multiline
          value={d.bio}
          onChangeText={(v) => d.set({ bio: v })}
          maxLength={160}
          hint={`${d.bio.length}/160`}
          error={errors.bio}
        />
        <InterestsInput value={d.interests} onChange={(v) => d.set({ interests: v })} error={errors.interests} />
        <Text style={styles.note}>
          Tap Finish and you’re in. Start sharing your sports activities right away.
        </Text>
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errors: { gap: Spacing.sm },
  error: { ...Type.caption, color: Colors.danger, textAlign: 'center' },
  note: { ...Type.small, color: Colors.muted },
});
