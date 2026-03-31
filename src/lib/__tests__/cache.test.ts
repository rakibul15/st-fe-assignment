import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createQueryCache, createCacheKey } from '../cache';

describe('createCacheKey', () => {
  it('creates a stable key from params', () => {
    const key = createCacheKey({ page: '1', limit: '12', category: 'electronics' });
    expect(key).toBe(JSON.stringify([['category', 'electronics'], ['limit', '12'], ['page', '1']]));
  });

  it('sorts keys alphabetically for stability', () => {
    const a = createCacheKey({ z: '1', a: '2' });
    const b = createCacheKey({ a: '2', z: '1' });
    expect(a).toBe(b);
  });

  it('filters out undefined and empty string values', () => {
    const key = createCacheKey({ page: '1', category: undefined, search: '' });
    expect(key).toBe(JSON.stringify([['page', '1']]));
  });
});

describe('createQueryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves values', () => {
    const cache = createQueryCache({ staleTime: 1000 });
    cache.set('key1', { value: 'hello' });
    expect(cache.get('key1')).toEqual({ value: 'hello' });
  });

  it('returns undefined for missing keys', () => {
    const cache = createQueryCache();
    expect(cache.get('missing')).toBeUndefined();
  });

  it('reports fresh data within staleTime', () => {
    const cache = createQueryCache({ staleTime: 1000 });
    cache.set('key1', 'data');
    expect(cache.isFresh('key1')).toBe(true);

    vi.advanceTimersByTime(999);
    expect(cache.isFresh('key1')).toBe(true);

    vi.advanceTimersByTime(2);
    expect(cache.isFresh('key1')).toBe(false);
  });

  it('evicts entries beyond gcTime', () => {
    const cache = createQueryCache({ gcTime: 5000 });
    cache.set('key1', 'data');

    vi.advanceTimersByTime(5001);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('evicts LRU entries when maxSize exceeded', () => {
    const cache = createQueryCache({ maxSize: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // should evict 'a'

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('moves accessed entries to end (LRU)', () => {
    const cache = createQueryCache({ maxSize: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // access 'a', making 'b' the oldest
    cache.set('c', 3); // should evict 'b'

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('invalidates a specific key', () => {
    const cache = createQueryCache();
    cache.set('key1', 'data');
    cache.invalidate('key1');
    expect(cache.get('key1')).toBeUndefined();
  });

  it('clears all entries', () => {
    const cache = createQueryCache();
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
