import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { accountApi, errorMessage } from '@/api';
import { Avatar, Chip, ProgressBar, TextField, Touchable } from '@/components/ui';
import { Colors, Radius, Spacing, Type, type Characters } from '@/theme';

/** "Step 2 of 3" header block for onboarding screens. */
export function StepIntro({ step, total = 3, title, subtitle }: { step: number; total?: number; title: string; subtitle?: string }) {
  return (
    <View style={styles.intro}>
      <Text style={styles.step}>
        Step {step} of {total}
      </Text>
      <ProgressBar value={step / total} height={4} />
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/**
 * Avatar chooser: picks from the library, uploads to POST /me/avatar with
 * progress, then reports the media id.
 */
export function AvatarPicker({
  uri,
  name,
  onUploaded,
  onRemove,
  character,
}: {
  uri: string | null;
  name?: string;
  /** Drawn placeholder shown until a photo is added. */
  character?: keyof typeof Characters;
  onUploaded: (mediaId: number, localUri: string) => void;
  onRemove?: () => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos access needed', 'Allow access to your photos to choose a profile picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    setProgress(0);
    try {
      const media = await accountApi.uploadAvatar({ uri: a.uri, name: a.fileName, type: a.mimeType }, (f) => setProgress(f)).promise;
      onUploaded(media.id, a.uri);
    } catch (e) {
      Alert.alert('Upload failed', errorMessage(e));
    } finally {
      setProgress(null);
    }
  };

  const uploading = progress !== null;
  return (
    <View style={styles.avatarWrap}>
      <Touchable onPress={pick} disabled={uploading} accessibilityLabel={uri ? 'Change profile photo' : 'Add profile photo'} style={styles.avatarBtn}>
        <Avatar uri={uri} name={name} size={112} character={character} ring />
        <View style={styles.cam}>
          {uploading ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="camera" size={16} color={Colors.white} />}
        </View>
      </Touchable>
      {uploading ? (
        <View style={styles.progress}>
          <ProgressBar value={progress ?? 0} height={4} />
          <Text style={styles.hint}>Uploading… {Math.round((progress ?? 0) * 100)}%</Text>
        </View>
      ) : (
        <View style={styles.avatarActions}>
          <Text style={styles.link} onPress={pick} accessibilityRole="button">
            {uri ? 'Change photo' : 'Add a photo'}
          </Text>
          {uri && onRemove ? (
            <Text style={[styles.link, styles.remove]} onPress={onRemove} accessibilityRole="button">
              Remove
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

/** Free-text interest tags (max 10, 30 chars each). */
export function InterestsInput({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string | null }) {
  const [text, setText] = useState('');
  const add = () => {
    const t = text.trim().replace(/\s+/g, ' ').slice(0, 30);
    if (!t) return;
    if (value.some((v) => v.toLowerCase() === t.toLowerCase())) {
      setText('');
      return;
    }
    if (value.length >= 10) {
      Alert.alert('Up to 10 interests', 'Remove one to add another.');
      return;
    }
    onChange([...value, t]);
    setText('');
  };
  return (
    <View style={styles.interests}>
      <TextField
        label="Interests"
        optional
        placeholder="e.g. Football, Painting"
        value={text}
        onChangeText={setText}
        onSubmitEditing={add}
        returnKeyType="done"
        submitBehavior="submit"
        maxLength={30}
        error={error}
        hint={`${value.length}/10 · press done to add`}
      />
      {value.length ? (
        <View style={styles.tags}>
          {value.map((v) => (
            <Chip key={v} label={v} icon="close" selected onPress={() => onChange(value.filter((x) => x !== v))} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing.sm, marginBottom: Spacing.sm },
  step: { ...Type.caption, fontWeight: '600', color: Colors.primary },
  title: { ...Type.title, color: Colors.ink, marginTop: Spacing.sm },
  subtitle: { ...Type.body, color: Colors.muted },
  avatarWrap: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  avatarBtn: { borderRadius: 56 },
  cam: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { width: 160, gap: Spacing.xs, alignItems: 'center' },
  hint: { ...Type.caption, color: Colors.muted },
  avatarActions: { flexDirection: 'row', gap: Spacing.lg },
  link: { ...Type.small, fontWeight: '600', color: Colors.primary, paddingVertical: Spacing.sm },
  remove: { color: Colors.danger },
  interests: { gap: Spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, borderRadius: Radius.md },
});
