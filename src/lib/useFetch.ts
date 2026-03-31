import { useState, useEffect, useRef, useCallback } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  error: unknown;
  isFetching: boolean;
  isRevalidating: boolean;
  /** Increment to force a re-fetch with same params */
  refetch: () => void;
}

/**
 * Single-effect data fetcher.
 *
 * React 19 best practice: ONE useEffect for external sync (network).
 * Everything else is event-driven or derived state.
 */
export function useFetch<TParams, TData>(
  params: TParams,
  fetcher: (params: TParams, signal: { cancelled: boolean }) => Promise<TData>,
): UseFetchResult<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchIdRef = useRef(0);
  const dataRef = useRef<TData | null>(null);
  const prevParamsRef = useRef<TParams>(params);

  // Single useEffect — the ONLY place we sync with the network
  useEffect(() => {
    const signal = { cancelled: false };
    const fetchId = ++fetchIdRef.current;

    const paramsChanged = prevParamsRef.current !== params;
    prevParamsRef.current = params;

    /* eslint-disable react-hooks/set-state-in-effect -- Intentional: synchronous loading state before async fetch */
    if (dataRef.current !== null && !paramsChanged) {
      setIsRevalidating(true);
    } else {
      setIsFetching(true);
    }
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    fetcher(params, signal)
      .then((result) => {
        if (signal.cancelled || fetchId !== fetchIdRef.current) return;
        dataRef.current = result;
        setData(result);
        setIsFetching(false);
        setIsRevalidating(false);
      })
      .catch((err) => {
        if (signal.cancelled || fetchId !== fetchIdRef.current) return;
        // Stale-while-error: keep old data if available
        if (dataRef.current !== null) {
          setIsRevalidating(false);
          return;
        }
        setError(err);
        setIsFetching(false);
        setIsRevalidating(false);
      });

    return () => {
      signal.cancelled = true;
    };
  }, [params, fetcher, retryCount]);

  const refetch = useCallback(() => setRetryCount((c) => c + 1), []);

  return { data, error, isFetching, isRevalidating, refetch };
}
