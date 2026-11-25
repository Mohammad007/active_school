import { useState } from 'react';
import { Alert } from 'react-native';

import { accountApi, errorMessage } from '@/api';
import { useSession } from '@/stores/session';
import type { Preferences } from '@/types';

export const DEFAULT_PREFERENCES: Preferences = {
  privacy: { profile_visibility: 'class', show_on_leaderboard: true, allow_tagging: true },
  notifications: { activities: true, challenges: true, events: true, rewards: true, push: true },
  language: 'en',
};

type PrefsPatch = { privacy?: Partial<Preferences['privacy']>; notifications?: Partial<Preferences['notifications']>; language?: 'en' | 'hi' };

function merge(base: Preferences, patch: PrefsPatch): Preferences {
  return {
    privacy: { ...base.privacy, ...patch.privacy },
    notifications: { ...base.notifications, ...patch.notifications },
    language: patch.language ?? base.language,
  };
}

/** Current preferences (merged over defaults) + optimistic PATCH /me/preferences with rollback. */
export function usePreferences() {
  const stored = useSession((s) => s.me?.student?.preferences);
  const patchStudent = useSession((s) => s.patchStudent);
  const [saving, setSaving] = useState(false);
  const prefs: Preferences = stored ? merge(DEFAULT_PREFERENCES, stored) : DEFAULT_PREFERENCES;

  const update = async (patch: PrefsPatch) => {
    const previous = prefs;
    patchStudent({ preferences: merge(previous, patch) });
    setSaving(true);
    try {
      const saved = await accountApi.updatePreferences(patch);
      patchStudent({ preferences: merge(DEFAULT_PREFERENCES, saved) });
    } catch (e) {
      patchStudent({ preferences: previous });
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return { prefs, update, saving };
}
