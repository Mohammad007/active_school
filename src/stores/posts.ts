import { Alert } from 'react-native';
import { create } from 'zustand';

import { errorMessage, socialApi } from '@/api';
import type { Activity } from '@/types';

/**
 * Optimistic social state shared between feed, post detail, saved and profiles,
 * so appreciating a post on its detail screen is reflected in the feed card.
 * Server data is the base; these are per-post overrides.
 */
interface Override {
  appreciated?: boolean;
  appreciations?: number;
  saved?: boolean;
  comments?: number;
  deleted?: boolean;
}

interface PostsState {
  overrides: Record<number, Override>;
  patch: (id: number, o: Override) => void;
  reset: () => void;
}

export const usePostOverrides = create<PostsState>((set) => ({
  overrides: {},
  patch: (id, o) => set((s) => ({ overrides: { ...s.overrides, [id]: { ...s.overrides[id], ...o } } })),
  reset: () => set({ overrides: {} }),
}));

/** The post merged with any local overrides. */
export function usePost(post: Activity): Activity {
  const o = usePostOverrides((s) => s.overrides[post.id]);
  if (!o) return post;
  return {
    ...post,
    appreciated_by_me: o.appreciated ?? post.appreciated_by_me,
    appreciations_count: o.appreciations ?? post.appreciations_count,
    saved_by_me: o.saved ?? post.saved_by_me,
    comments_count: o.comments ?? post.comments_count,
  };
}

const inflight = new Set<string>();

export async function toggleAppreciate(post: Activity) {
  const key = `a${post.id}`;
  if (inflight.has(key)) return;
  inflight.add(key);
  const { patch } = usePostOverrides.getState();
  const on = !post.appreciated_by_me;
  const prev = { appreciated: post.appreciated_by_me, appreciations: post.appreciations_count };
  patch(post.id, { appreciated: on, appreciations: Math.max(0, post.appreciations_count + (on ? 1 : -1)) });
  try {
    const res = await socialApi.appreciate(post.id, on);
    patch(post.id, { appreciated: res.appreciated, appreciations: res.appreciations_count });
  } catch (e) {
    patch(post.id, prev);
    Alert.alert('Could not update', errorMessage(e));
  } finally {
    inflight.delete(key);
  }
}

export async function toggleSave(post: Activity) {
  const key = `s${post.id}`;
  if (inflight.has(key)) return;
  inflight.add(key);
  const { patch } = usePostOverrides.getState();
  const on = !post.saved_by_me;
  patch(post.id, { saved: on });
  try {
    const res = await socialApi.save(post.id, on);
    patch(post.id, { saved: res.saved });
  } catch (e) {
    patch(post.id, { saved: !on });
    Alert.alert('Could not update', errorMessage(e));
  } finally {
    inflight.delete(key);
  }
}
