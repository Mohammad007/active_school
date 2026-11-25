import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { newKey, type DraftPhoto } from '@/stores/draftStore';

function toDraft(assets: ImagePicker.ImagePickerAsset[], maxMb: number): DraftPhoto[] {
  const limit = maxMb * 1024 * 1024;
  const tooBig = assets.filter((a) => a.fileSize && a.fileSize > limit);
  if (tooBig.length) {
    Alert.alert(
      tooBig.length === 1 ? 'Photo too large' : `${tooBig.length} photos too large`,
      `Each photo must be ${maxMb} MB or smaller. Those photos were skipped.`,
    );
  }
  return assets
    .filter((a) => !(a.fileSize && a.fileSize > limit))
    .map((a) => ({
      key: newKey(),
      uri: a.uri,
      width: a.width || undefined,
      height: a.height || undefined,
      mimeType: a.mimeType ?? null,
      fileName: a.fileName ?? null,
    }));
}

function denied(what: string) {
  Alert.alert(`Allow ${what} access`, `ActiveSchool needs ${what} access to add photos. You can turn it on in Settings.`, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => undefined) },
  ]);
}

/** Pick up to `remaining` images from the library. Returns [] when cancelled. */
export async function pickFromLibrary(remaining: number, maxMb: number): Promise<DraftPhoto[]> {
  if (remaining <= 0) return [];
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    denied('photo library');
    return [];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: remaining > 1,
    selectionLimit: remaining,
    orderedSelection: true,
    quality: 0.8,
  });
  if (res.canceled || !res.assets) return [];
  return toDraft(res.assets.slice(0, remaining), maxMb);
}

/** Take one photo with the camera. Returns [] when cancelled. */
export async function takePhoto(maxMb: number): Promise<DraftPhoto[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    denied('camera');
    return [];
  }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (res.canceled || !res.assets) return [];
  return toDraft(res.assets, maxMb);
}
