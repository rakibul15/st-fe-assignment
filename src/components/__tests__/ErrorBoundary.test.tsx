import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const originalConsoleError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

function ThrowingChild({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary fallback={<div>Fallback</div>}>
        <div>Hello</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
  });

  it('renders static fallback ReactNode when child throws', () => {
    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });

  it('renders function fallback with error and reset callback', () => {
    render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <span>Error: {error.message}</span>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('reset clears error state and re-renders children', () => {
    let shouldThrow = true;

    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered</div>;
    }

    render(
      <ErrorBoundary
        fallback={(_error, reset) => (
          <button onClick={reset}>Reset</button>
        )}
      >
        <ConditionalThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });

  it('componentDidCatch logs error to console', () => {
    render(
      <ErrorBoundary fallback={<div>Fallback</div>}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(console.error).toHaveBeenCalledWith(
      '[ErrorBoundary]',
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });
});
