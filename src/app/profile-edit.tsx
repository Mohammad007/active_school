import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { accountApi, errorMessage, fieldErrors } from '@/api';
import { AvatarPicker, InterestsInput } from '@/components/auth/OnboardingParts';
import { Button, Card, characterFor, EmptyState, FormScroll, Header, InfoRow, Screen, TextField } from '@/components/ui';
import { goBack } from '@/lib/nav';
import { useSession } from '@/stores/session';
import { Colors, Spacing, Type } from '@/theme';
import type { ProfileUpdateInput } from '@/types';

/** Edit the public profile (PATCH /me/profile). */
export default function ProfileEdit() {
  const student = useSession((s) => s.me?.student);
  const [displayName, setDisplayName] = useState(student?.display_name ?? '');
  const [bio, setBio] = useState(student?.bio ?? '');
  const [interests, setInterests] = useState<string[]>(student?.interests ?? []);
  const [avatarUri, setAvatarUri] = useState<string | null>(student?.avatar_url ?? null);
  // undefined = unchanged, null = removed, number = new upload
  const [avatarId, setAvatarId] = useState<number | null | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!student) {
    return (
      <Screen>
        <Header title="Edit profile" />
        <EmptyState icon="person-outline" title="Profile not set up" message="Finish setting up your account first." />
      </Screen>
    );
  }

  const save = async () => {
    const e: Record<string, string> = {};
    if (displayName.trim().length < 2) e.display_name = 'Enter a display name (2–40 characters).';
    setErrors(e);
    if (Object.keys(e).length) return;

    const body: ProfileUpdateInput = {
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      interests,
    };
    if (avatarId !== undefined) body.avatar_media_id = avatarId;

    setBusy(true);
    try {
      const profile = await accountApi.updateProfile(body);
      useSession.getState().patchStudent(profile);
      goBack('/(tabs)/profile');
    } catch (err) {
      const f = fieldErrors(err);
      if (Object.keys(f).length) setErrors(f);
      else Alert.alert('Could not save', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen background={Colors.surface}>
      <Header title="Edit profile" />
      <FormScroll footer={<Button label="Save changes" onPress={save} loading={busy} />}>
        <AvatarPicker
          uri={avatarUri}
          name={displayName}
          character={characterFor(student?.gender)}
          onUploaded={(id, uri) => {
            setAvatarId(id);
            setAvatarUri(uri);
          }}
          onRemove={() => {
            setAvatarId(null);
            setAvatarUri(null);
          }}
        />
        {errors.avatar_media_id ? <Text style={styles.error}>{errors.avatar_media_id}</Text> : null}

        <TextField label="Display name" value={displayName} onChangeText={setDisplayName} maxLength={40} error={errors.display_name} />
        <TextField label="Bio" optional multiline value={bio} onChangeText={setBio} maxLength={160} hint={`${bio.length}/160`} error={errors.bio} />
        <InterestsInput value={interests} onChange={setInterests} error={errors.interests} />

        <Text style={styles.section}>Your school</Text>
        <Card style={styles.card}>
          <InfoRow label="Full name" value={student.name} />
          <InfoRow label="School" value={student.school?.name} />
          <InfoRow label="Class" value={student.class_label} last />
        </Card>
        <Text style={styles.note}>To change these, raise a class/school change request in Help & support.</Text>

      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.sm },
  error: { ...Type.caption, color: Colors.danger, textAlign: 'center' },
  section: { ...Type.subheading, color: Colors.ink, marginTop: Spacing.sm },
  card: { paddingVertical: Spacing.xs },
  note: { ...Type.caption, color: Colors.muted },
});
