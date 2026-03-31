import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const div = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const { initial, animate, exit, transition, ...htmlProps } = props;
    void initial; void animate; void exit; void transition;
    return <div {...htmlProps}>{children}</div>;
  };
  return {
    motion: { div },
    m: { div },
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
    LazyMotion: ({ children }: React.PropsWithChildren) => children,
    domAnimation: {},
  };
});

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  AlertTriangle: () => <span data-testid="icon-alert-triangle">!</span>,
  WifiOff: () => <span data-testid="icon-wifi-off">W</span>,
  AlertCircle: () => <span data-testid="icon-alert-circle">A</span>,
}));

import { ErrorProvider } from '../ErrorProvider';
import { useErrorHandler } from '../useErrorHandler';

function TestConsumer() {
  const { reportError, dismissAll } = useErrorHandler();
  return (
    <div>
      <button onClick={() => reportError(new Error('Toast 1'))}>Report 1</button>
      <button onClick={() => reportError(new Error('Toast 2'))}>Report 2</button>
      <button onClick={() => reportError(new Error('Toast 3'))}>Report 3</button>
      <button onClick={() => reportError(new Error('Toast 4'))}>Report 4</button>
      <button onClick={() => dismissAll()}>Dismiss All</button>
      <span>Consumer rendered</span>
    </div>
  );
}

describe('ErrorProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <ErrorProvider>
        <div>Hello children</div>
      </ErrorProvider>,
    );

    expect(screen.getByText('Hello children')).toBeInTheDocument();
  });

  it('reportError shows a toast with error message', () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Report 1'));
    });

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
  });

  it('dismiss removes a specific toast', () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Report 1'));
    });

    expect(screen.getByText('Toast 1')).toBeInTheDocument();

    // Click the dismiss button on the toast (the X icon button)
    const dismissButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('[data-testid="icon-x"]'),
    );
    expect(dismissButtons.length).toBeGreaterThan(0);

    act(() => {
      fireEvent.click(dismissButtons[0]);
    });

    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
  });

  it('dismissAll clears all toasts', () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Report 1'));
      fireEvent.click(screen.getByText('Report 2'));
    });

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Dismiss All'));
    });

    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
  });

  it('auto-dismisses toasts after 6 seconds', () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Report 1'));
    });

    expect(screen.getByText('Toast 1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
  });

  it('enforces max 3 toasts, evicting older ones', () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Report 1'));
    });
    act(() => {
      fireEvent.click(screen.getByText('Report 2'));
    });
    act(() => {
      fireEvent.click(screen.getByText('Report 3'));
    });
    act(() => {
      fireEvent.click(screen.getByText('Report 4'));
    });

    // Toast 1 should be evicted since max is 3
    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
    expect(screen.getByText('Toast 4')).toBeInTheDocument();
  });

  it('useErrorHandler throws when used outside provider', () => {
    // Suppress console.error from React for the expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useErrorHandler());
    }).toThrow();

    spy.mockRestore();
  });
});
