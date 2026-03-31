import { describe, it, expect, vi } from 'vitest';
import { normalizeError, errorBus } from '../errors';

describe('normalizeError', () => {
  it('normalizes AbortError as TIMEOUT', () => {
    const err = new DOMException('Aborted', 'AbortError');
    const result = normalizeError(err);
    expect(result.code).toBe('TIMEOUT');
    expect(result.retryable).toBe(true);
  });

  it('normalizes TypeError as NETWORK_ERROR', () => {
    const err = new TypeError('Failed to fetch');
    const result = normalizeError(err);
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.retryable).toBe(true);
  });

  it('normalizes error with status 404 as NOT_FOUND', () => {
    const err = Object.assign(new Error('Not found'), { status: 404 });
    const result = normalizeError(err);
    expect(result.code).toBe('NOT_FOUND');
    expect(result.retryable).toBe(false);
  });

  it('normalizes error with status 500 as SERVER_ERROR', () => {
    const err = Object.assign(new Error('Server error'), { status: 500 });
    const result = normalizeError(err);
    expect(result.code).toBe('SERVER_ERROR');
    expect(result.retryable).toBe(true);
  });

  it('normalizes error with "network" in message as NETWORK_ERROR', () => {
    const err = new Error('network timeout');
    const result = normalizeError(err);
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.retryable).toBe(true);
  });

  it('normalizes generic Error as SERVER_ERROR', () => {
    const err = new Error('Something broke');
    const result = normalizeError(err);
    expect(result.code).toBe('SERVER_ERROR');
    expect(result.retryable).toBe(true);
  });

  it('normalizes non-Error values as UNKNOWN', () => {
    const result = normalizeError('string error');
    expect(result.code).toBe('UNKNOWN');
    expect(result.retryable).toBe(false);
  });
});

describe('errorBus', () => {
  it('emits errors to subscribers', () => {
    const listener = vi.fn();
    const unsub = errorBus.subscribe(listener);

    const error = { code: 'UNKNOWN' as const, message: 'test', retryable: false };
    errorBus.emit(error);

    expect(listener).toHaveBeenCalledWith(error);
    unsub();
  });

  it('unsubscribes correctly', () => {
    const listener = vi.fn();
    const unsub = errorBus.subscribe(listener);
    unsub();

    errorBus.emit({ code: 'UNKNOWN' as const, message: 'test', retryable: false });
    expect(listener).not.toHaveBeenCalled();
  });
});
