import { Alert } from 'react-native';

import { go } from '@/lib/nav';
import { useDraftStore } from '@/stores/draftStore';
import type { ActivityLevel } from '@/types';

interface Prefill {
  challenge?: { id: number; title: string } | null;
  event?: { id: number; title: string } | null;
  categoryId?: number | null;
  level?: ActivityLevel;
}

/**
 * Start a new activity draft linked to a challenge or event and open the composer.
 * Asks before discarding an unrelated draft that already has content.
 */
export function startLinkedDraft(prefill: Prefill) {
  const draft = useDraftStore.getState();
  const sameLink =
    (prefill.challenge && draft.challenge?.id === prefill.challenge.id) || (prefill.event && draft.event?.id === prefill.event.id);

  const apply = () => {
    const d = useDraftStore.getState();
    d.reset();
    if (prefill.challenge) d.set('challenge', prefill.challenge);
    if (prefill.event) d.set('event', prefill.event);
    if (prefill.categoryId) d.set('categoryId', prefill.categoryId);
    if (prefill.level) d.set('level', prefill.level);
    go('/(tabs)/create');
  };

  if (sameLink) {
    go('/(tabs)/create');
    return;
  }
  if (draft.hasContent() || draft.editingId) {
    Alert.alert('Replace your draft?', 'You have an unfinished activity. Starting a new one will discard it.', [
      { text: 'Keep draft', style: 'cancel', onPress: () => go('/(tabs)/create') },
      { text: 'Start new', style: 'destructive', onPress: apply },
    ]);
    return;
  }
  apply();
}
