import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/api';
import type { PageMeta, Paged } from '@/types';

export interface PageParam {
  page: number;
  cursor: string | null;
}

export interface PagedState<T, M extends PageMeta = PageMeta> {
  items: T[];
  /** Meta of the first page (e.g. points summary). */
  meta: M | undefined;
  error: ApiError | null;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  /** Error while loading the next page (list stays on screen). */
  moreError: ApiError | null;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  loadMore: () => void;
  setItems: (updater: (items: T[]) => T[]) => void;
}

function asApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError(0, 'unknown', e instanceof Error ? e.message : 'Something went wrong.');
}

/**
 * Infinite list over a paginated endpoint. Works for both page-numbered
 * (`meta.current_page/has_more`) and cursor (`meta.next_cursor`) lists.
 */
export function usePaged<T, M extends PageMeta = PageMeta>(
  fetchPage: (p: PageParam) => Promise<Paged<T, M>>,
  deps: unknown[] = [],
  options: { enabled?: boolean; refetchOnFocus?: boolean; keyOf?: (item: T) => string | number } = {},
): PagedState<T, M> {
  const { enabled = true, refetchOnFocus = false } = options;
  const keyOf = options.keyOf ?? ((item: T) => (item as unknown as { id: number }).id);
  const keyRef = useRef(keyOf);
  keyRef.current = keyOf;

  const [items, setItemsState] = useState<T[]>([]);
  const [meta, setMeta] = useState<M | undefined>(undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [moreError, setMoreError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const next = useRef<PageParam>({ page: 1, cursor: null });
  const seq = useRef(0);
  const busyMore = useRef(false);
  const loadedOnce = useRef(false);

  const applyMeta = useCallback((m: M | undefined, page: number) => {
    const more = m?.next_cursor !== undefined ? !!m.next_cursor : !!m?.has_more;
    setHasMore(more);
    next.current = { page: (m?.current_page ?? page) + 1, cursor: m?.next_cursor ?? null };
  }, []);

  const loadFirst = useCallback(async (mode: 'initial' | 'refresh' | 'silent') => {
    const mine = ++seq.current;
    busyMore.current = false;
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      const res = await fetchRef.current({ page: 1, cursor: null });
      if (mine !== seq.current) return;
      setItemsState(res.data);
      setMeta(res.meta);
      applyMeta(res.meta, 1);
      setError(null);
      setMoreError(null);
      loadedOnce.current = true;
    } catch (e) {
      if (mine !== seq.current) return;
      if (mode !== 'silent' || !loadedOnce.current) setError(asApiError(e));
    } finally {
      if (mine === seq.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, [applyMeta]);

  const loadMore = useCallback(() => {
    if (busyMore.current || !hasMore || loading || refreshing) return;
    busyMore.current = true;
    const mine = seq.current;
    setLoadingMore(true);
    setMoreError(null);
    const param = next.current;
    fetchRef.current(param)
      .then((res) => {
        if (mine !== seq.current) return;
        setItemsState((prev) => {
          const seen = new Set(prev.map((i) => keyRef.current(i)));
          return [...prev, ...res.data.filter((i) => !seen.has(keyRef.current(i)))];
        });
        applyMeta(res.meta, param.page);
      })
      .catch((e) => {
        if (mine === seq.current) setMoreError(asApiError(e));
      })
      .finally(() => {
        if (mine === seq.current) {
          busyMore.current = false;
          setLoadingMore(false);
        }
      });
  }, [hasMore, loading, refreshing, applyMeta]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    loadedOnce.current = false;
    setItemsState([]);
    loadFirst('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, loadFirst, ...deps]);

  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus && enabled && loadedOnce.current) loadFirst('silent');
    }, [refetchOnFocus, enabled, loadFirst]),
  );

  return {
    items,
    meta,
    error,
    loading: loading && items.length === 0,
    refreshing,
    loadingMore,
    hasMore,
    moreError,
    refresh: useCallback(() => loadFirst('refresh'), [loadFirst]),
    reload: useCallback(() => loadFirst(loadedOnce.current ? 'silent' : 'initial'), [loadFirst]),
    loadMore,
    setItems: useCallback((updater: (items: T[]) => T[]) => setItemsState(updater), []),
  };
}
