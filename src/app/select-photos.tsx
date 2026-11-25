import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoThumb } from '@/components/create/PhotoThumb';
import { pickFromLibrary, takePhoto } from '@/components/create/pickers';
import { Button, contentWidth, EmptyState, Header, IconButton, Screen } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { goBack } from '@/lib/nav';
import { useDraftStore } from '@/stores/draftStore';
import { useSession } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';

/** Choose, order and remove the 1-5 public photos of an activity. */
export default function SelectPhotosScreen() {
  const photos = useDraftStore((s) => s.photos);
  const addPhotos = useDraftStore((s) => s.addPhotos);
  const removePhoto = useDraftStore((s) => s.removePhoto);
  const movePhoto = useDraftStore((s) => s.movePhoto);
  const config = useSession((s) => s.config);
  const max = config?.uploads?.max_photos ?? 5;
  const maxMb = config?.uploads?.max_photo_mb ?? 10;
  const remaining = Math.max(0, max - photos.length);
  const [busy, setBusy] = useState(false);

  const { contentWidth: cw, isTablet } = useLayout();
  const cols = isTablet ? 4 : 3;
  const gap = Spacing.sm;
  const size = Math.floor((cw - ScreenPadding * 2 - gap * (cols - 1)) / cols);

  const run = async (fn: () => Promise<Parameters<typeof addPhotos>[0]>) => {
    setBusy(true);
    try {
      const picked = await fn();
      if (picked.length) addPhotos(picked, max);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Photos" subtitle={`${photos.length} of ${max} · first photo is the cover`} />
      <ScrollView contentContainerStyle={[styles.body, contentWidth]}>
        {photos.length === 0 ? (
          <EmptyState icon="images-outline" title="Add up to 5 photos" message={`JPEG, PNG or WebP, up to ${maxMb} MB each. Avoid photos showing documents, addresses or children who have not agreed to be shared.`} />
        ) : (
          <View style={[styles.grid, { gap }]}>
            {photos.map((p, i) => (
              <Animated.View key={p.key} entering={FadeIn} layout={LinearTransition} style={{ width: size }}>
                <PhotoThumb uri={p.uri} size={size} order={i + 1} onRemove={() => removePhoto(p.key)} label={`photo ${i + 1}`} />
                <View style={styles.moves}>
                  <IconButton
                    icon="chevron-back"
                    size={18}
                    label={`Move photo ${i + 1} earlier`}
                    onPress={() => movePhoto(p.key, -1)}
                    disabled={i === 0}
                    color={Colors.body}
                  />
                  <Text style={styles.pos}>{i === 0 ? 'Cover' : `#${i + 1}`}</Text>
                  <IconButton
                    icon="chevron-forward"
                    size={18}
                    label={`Move photo ${i + 1} later`}
                    onPress={() => movePhoto(p.key, 1)}
                    disabled={i === photos.length - 1}
                    color={Colors.body}
                  />
                </View>
              </Animated.View>
            ))}
          </View>
        )}
        <Text style={styles.hint}>
          {remaining > 0 ? `You can add ${remaining} more.` : 'You have reached the photo limit. Remove one to add another.'}
        </Text>
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={[styles.actions, contentWidth]}>
          <View style={styles.row}>
            <Button
              label="Library"
              icon="images-outline"
              variant="secondary"
              onPress={() => run(() => pickFromLibrary(remaining, maxMb))}
              disabled={remaining === 0 || busy}
              full={false}
              style={styles.flex}
            />
            <Button
              label="Camera"
              icon="camera-outline"
              variant="secondary"
              onPress={() => run(() => takePhoto(maxMb))}
              disabled={remaining === 0 || busy}
              full={false}
              style={styles.flex}
            />
          </View>
          <Button label="Done" onPress={() => goBack('/(tabs)/create')} disabled={busy} />
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: ScreenPadding, gap: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  moves: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pos: { ...Type.caption, color: Colors.muted },
  hint: { ...Type.caption, color: Colors.muted, textAlign: 'center' },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  actions: { gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm },
});
