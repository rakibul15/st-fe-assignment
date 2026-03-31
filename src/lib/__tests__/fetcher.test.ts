import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '../fetcher';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('data');
    const result = await fetchWithRetry(fn);
    expect(result).toBe('data');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValue('data');

    const onRetry = vi.fn();

    const promise = fetchWithRetry(fn, { maxRetries: 3, retryDelay: 100, onRetry });

    // Advance past the retry delay (exponential: 100ms * 2^0 + jitter)
    await vi.advanceTimersByTimeAsync(500);

    const result = await promise;
    expect(result).toBe('data');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, 3);
  });

  it('throws after all retries exhausted', async () => {
    vi.useRealTimers();
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      fetchWithRetry(fn, { maxRetries: 2, retryDelay: 10 }),
    ).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('throws immediately if cancelled before start', async () => {
    const fn = vi.fn().mockResolvedValue('data');
    const signal = { cancelled: true };

    await expect(fetchWithRetry(fn, { signal })).rejects.toThrow('Request was cancelled');
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls onRetry callback with attempt info', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const onRetry = vi.fn();
    const promise = fetchWithRetry(fn, { maxRetries: 3, retryDelay: 50, onRetry });

    await vi.advanceTimersByTimeAsync(10000);

    await promise;
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, 3);
    expect(onRetry).toHaveBeenCalledWith(2, 3);
  });
});
