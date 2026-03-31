import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetch } from '../useFetch';

describe('useFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in loading state', () => {
    const fetcher = vi.fn(() => new Promise<string>(() => {})); // never resolves
    const { result } = renderHook(() => useFetch({ q: 'test' }, fetcher));

    expect(result.current.isFetching).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns data on successful fetch', async () => {
    vi.useRealTimers();
    const fetcher = vi.fn().mockResolvedValue('hello');
    const { result } = renderHook(() => useFetch({ q: 'test' }, fetcher));

    await waitFor(() => {
      expect(result.current.data).toBe('hello');
    });
    expect(result.current.isFetching).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns error on failed fetch with no prior data', async () => {
    vi.useRealTimers();
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useFetch({ q: 'test' }, fetcher));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('sets isFetching when params change', async () => {
    vi.useRealTimers();

    let resolve: (v: string) => void;
    const fetcher = vi.fn().mockImplementation(
      () => new Promise<string>((r) => { resolve = r; }),
    );

    const { result, rerender } = renderHook(
      ({ params }) => useFetch(params, fetcher),
      { initialProps: { params: { q: 'first' } } },
    );

    // Resolve first fetch
    await act(async () => { resolve!('first-data'); });

    await waitFor(() => {
      expect(result.current.data).toBe('first-data');
    });

    // Change params — should set isFetching true (the bug we fixed)
    rerender({ params: { q: 'second' } });

    expect(result.current.isFetching).toBe(true);
  });

  it('sets isRevalidating (not isFetching) on refetch with same params', async () => {
    vi.useRealTimers();

    const fetcher = vi.fn().mockResolvedValue('data');
    // Stable reference — mimics useMemo in real app
    const stableParams = { q: 'test' };

    const { result } = renderHook(() => useFetch(stableParams, fetcher));

    await waitFor(() => {
      expect(result.current.data).toBe('data');
    });

    // Refetch with same params
    fetcher.mockImplementation(() => new Promise<string>(() => {})); // hang
    act(() => { result.current.refetch(); });

    await waitFor(() => {
      expect(result.current.isRevalidating).toBe(true);
    });
    // isFetching should remain false for same-param revalidation
    expect(result.current.isFetching).toBe(false);
  });

  it('keeps stale data on revalidation error (stale-while-error)', async () => {
    vi.useRealTimers();

    const fetcher = vi.fn().mockResolvedValue('good-data');

    const { result } = renderHook(() => useFetch({ q: 'test' }, fetcher));

    await waitFor(() => {
      expect(result.current.data).toBe('good-data');
    });

    // Refetch fails
    fetcher.mockRejectedValue(new Error('fail'));
    act(() => { result.current.refetch(); });

    await waitFor(() => {
      expect(result.current.isRevalidating).toBe(false);
    });

    // Data should still be available
    expect(result.current.data).toBe('good-data');
    expect(result.current.error).toBeNull();
  });

  it('cancels previous fetch when params change rapidly', async () => {
    vi.useRealTimers();

    let callCount = 0;
    const fetcher = vi.fn().mockImplementation(
      (params: { q: string }) =>
        new Promise<string>((resolve) => {
          callCount++;
          const myCall = callCount;
          setTimeout(() => resolve(`result-${myCall}-${params.q}`), 50);
        }),
    );

    const { result, rerender } = renderHook(
      ({ params }) => useFetch(params, fetcher),
      { initialProps: { params: { q: 'a' } } },
    );

    // Quickly change params before first fetch resolves
    rerender({ params: { q: 'b' } });

    // Wait for second fetch to resolve
    await waitFor(() => {
      expect(result.current.data).toContain('b');
    }, { timeout: 500 });

    // Should have the result from the second fetch, not the first
    expect(result.current.data).toBe('result-2-b');
  });
});
