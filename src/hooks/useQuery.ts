import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/api';

export interface QueryState<T> {
  data: T | undefined;
  error: ApiError | null;
  /** First load (no data yet). */
  loading: boolean;
  /** Pull-to-refresh in progress. */
  refreshing: boolean;
  /** Pull-to-refresh handler. */
  refresh: () => Promise<void>;
  /** Silent re-fetch (keeps current data on screen). */
  reload: () => Promise<void>;
  /** Optimistic local update. */
  setData: (updater: T | ((prev: T | undefined) => T | undefined)) => void;
}

function asApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError(0, 'unknown', e instanceof Error ? e.message : 'Something went wrong.');
}

interface Options {
  /** Skip fetching (e.g. missing id or feature off). */
  enabled?: boolean;
  /** Re-fetch silently whenever the screen regains focus (after the first load). */
  refetchOnFocus?: boolean;
}

/**
 * Small data hook: loading / error / pull-to-refresh / silent reload.
 * `deps` re-run the fetch (like useEffect deps); `fetcher` may change freely.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = [], options: Options = {}): QueryState<T> {
  const { enabled = true, refetchOnFocus = false } = options;
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const seq = useRef(0);
  const loadedOnce = useRef(false);

  const run = useCallback(async (mode: 'initial' | 'refresh' | 'silent') => {
    const mine = ++seq.current;
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      const result = await fetcherRef.current();
      if (mine !== seq.current) return;
      setDataState(result);
      setError(null);
      loadedOnce.current = true;
    } catch (e) {
      if (mine !== seq.current) return;
      // Keep stale data on a failed silent reload; surface the error otherwise.
      if (mode !== 'silent' || !loadedOnce.current) setError(asApiError(e));
    } finally {
      if (mine === seq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    loadedOnce.current = false;
    run('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus && enabled && loadedOnce.current) run('silent');
    }, [refetchOnFocus, enabled, run]),
  );

  const setData = useCallback((updater: T | ((prev: T | undefined) => T | undefined)) => {
    setDataState((prev) => (typeof updater === 'function' ? (updater as (p: T | undefined) => T | undefined)(prev) : updater));
  }, []);

  return {
    data,
    error,
    loading: loading && data === undefined,
    refreshing,
    refresh: useCallback(() => run('refresh'), [run]),
    reload: useCallback(() => run(loadedOnce.current ? 'silent' : 'initial'), [run]),
    setData,
  };
}
