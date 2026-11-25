import { create } from 'zustand';

/**
 * In-memory upload progress for the composer (not persisted).
 * Keyed by DraftPhoto.key.
 */
interface UploadsState {
  progress: Record<string, number>;
  failed: Record<string, string>;
  setProgress: (key: string, value: number) => void;
  setFailed: (key: string, message: string | null) => void;
  clear: () => void;
}

export const useUploads = create<UploadsState>((set) => ({
  progress: {},
  failed: {},
  setProgress: (key, value) => set((s) => ({ progress: { ...s.progress, [key]: value } })),
  setFailed: (key, message) =>
    set((s) => {
      const failed = { ...s.failed };
      if (message) failed[key] = message;
      else delete failed[key];
      return { failed };
    }),
  clear: () => set({ progress: {}, failed: {} }),
}));
