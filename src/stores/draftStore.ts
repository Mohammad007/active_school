import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { today } from '@/lib/format';
import type { Activity, ActivityLevel, ActivityResult } from '@/types';

/**
 * Activity composer draft. Persisted locally so a half-written activity
 * survives leaving the screen or restarting the app.
 *
 * Photos are local picker URIs until upload. `mediaId` is only kept for
 * media already attached to an activity being edited — fresh uploads are
 * not persisted because the server expires unattached uploads.
 */

export interface DraftPhoto {
  /** Stable client key. */
  key: string;
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string | null;
  fileName?: string | null;
  /** Server media id once uploaded / already attached. */
  mediaId?: number;
  /** True for media that came from the server (editing). */
  remote?: boolean;
}

export interface CreateDraft {
  /** Activity id when editing / resubmitting (PUT), otherwise null (POST). */
  editingId: number | null;
  title: string;
  caption: string;
  categoryId: number | null;
  occurredOn: string;
  level: ActivityLevel;
  result: ActivityResult;
  organizer: string;
  eventLink: string;
  challenge: { id: number; title: string } | null;
  event: { id: number; title: string } | null;
  photos: DraftPhoto[];
  evidence: DraftPhoto[];
  /** One key per submission attempt; reused on retry, renewed after success/reset. */
  idempotencyKey: string;
  updatedAt: number;
}

interface DraftState extends CreateDraft {
  set: <K extends keyof CreateDraft>(key: K, value: CreateDraft[K]) => void;
  reset: () => void;
  /** Start editing an existing activity (from submissions). */
  loadFromActivity: (a: Activity) => void;
  addPhotos: (photos: DraftPhoto[], max: number) => number;
  removePhoto: (key: string) => void;
  movePhoto: (key: string, dir: -1 | 1) => void;
  addEvidence: (photos: DraftPhoto[]) => void;
  removeEvidence: (key: string) => void;
  /** Remember a media id after upload (in memory + persisted for this draft). */
  setMediaId: (list: 'photos' | 'evidence', key: string, mediaId: number) => void;
  hasContent: () => boolean;
}

export const MAX_EVIDENCE = 5;

export const newKey = () => {
  try {
    return Crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

const initial = (): CreateDraft => ({
  editingId: null,
  title: '',
  caption: '',
  categoryId: null,
  occurredOn: today(),
  level: 'local',
  result: 'participation',
  organizer: '',
  eventLink: '',
  challenge: null,
  event: null,
  photos: [],
  evidence: [],
  idempotencyKey: newKey(),
  updatedAt: Date.now(),
});

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      ...initial(),
      set: (key, value) => set({ [key]: value, updatedAt: Date.now() } as Partial<DraftState>),
      reset: () => set(initial()),
      loadFromActivity: (a) =>
        set({
          ...initial(),
          editingId: a.id,
          title: a.title,
          caption: a.caption ?? '',
          categoryId: a.category?.id ?? null,
          occurredOn: a.occurred_on ?? today(),
          level: a.level,
          result: a.result,
          organizer: a.organizer ?? '',
          eventLink: a.event_link ?? '',
          challenge: a.challenge,
          event: a.event,
          photos: a.photos.map((p) => ({ key: `m${p.id}`, uri: p.url ?? p.thumb_url, width: p.width, height: p.height, mediaId: p.id, remote: true })),
          evidence: (a.evidence ?? []).map((p) => ({ key: `e${p.id}`, uri: p.thumb_url, mediaId: p.id, remote: true })),
        }),
      addPhotos: (photos, max) => {
        const current = get().photos;
        const room = Math.max(0, max - current.length);
        const added = photos.slice(0, room);
        set({ photos: [...current, ...added], updatedAt: Date.now() });
        return added.length;
      },
      removePhoto: (key) => set({ photos: get().photos.filter((p) => p.key !== key), updatedAt: Date.now() }),
      movePhoto: (key, dir) => {
        const list = [...get().photos];
        const i = list.findIndex((p) => p.key === key);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        set({ photos: list, updatedAt: Date.now() });
      },
      addEvidence: (photos) => set({ evidence: [...get().evidence, ...photos].slice(0, MAX_EVIDENCE), updatedAt: Date.now() }),
      removeEvidence: (key) => set({ evidence: get().evidence.filter((p) => p.key !== key), updatedAt: Date.now() }),
      setMediaId: (list, key, mediaId) => set({ [list]: get()[list].map((p) => (p.key === key ? { ...p, mediaId } : p)) } as Partial<DraftState>),
      hasContent: () => {
        const d = get();
        return !!(d.title.trim() || d.caption.trim() || d.photos.length || d.evidence.length);
      },
    }),
    {
      name: 'activeschool.draft',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        editingId: s.editingId,
        title: s.title,
        caption: s.caption,
        categoryId: s.categoryId,
        occurredOn: s.occurredOn,
        level: s.level,
        result: s.result,
        organizer: s.organizer,
        eventLink: s.eventLink,
        challenge: s.challenge,
        event: s.event,
        // Remote (already attached) media keep their ids; fresh uploads re-upload after a restart.
        photos: s.photos.map((p) => (p.remote ? p : { ...p, mediaId: undefined })),
        evidence: s.evidence.map((p) => (p.remote ? p : { ...p, mediaId: undefined })),
        idempotencyKey: s.idempotencyKey,
        updatedAt: s.updatedAt,
      }),
    },
  ),
);

/** Evidence is required for non-local levels or any placement (server enforces too). */
export function evidenceRequired(level: ActivityLevel, result: ActivityResult) {
  return level !== 'local' || result !== 'participation';
}
