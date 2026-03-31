import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 250));
    expect(result.current).toBe('hello');
  });

  it('does not update until delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 250),
      { initialProps: { value: 'hello' } },
    );

    rerender({ value: 'world' });
    expect(result.current).toBe('hello');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('hello');
  });

  it('updates after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 250),
      { initialProps: { value: 'hello' } },
    );

    rerender({ value: 'world' });

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('world');
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 250),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 'c' });
    act(() => { vi.advanceTimersByTime(100); });

    // Only 200ms since last change, should still be 'a'
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(150); });
    // Now 250ms since 'c' was set
    expect(result.current).toBe('c');
  });
});
