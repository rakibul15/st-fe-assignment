import { createContext } from 'react';

interface ErrorContextValue {
  /** Push an error to the global toast queue */
  reportError: (error: unknown) => void;
  /** Dismiss a specific toast */
  dismiss: (id: number) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
}

export const ErrorContext = createContext<ErrorContextValue | null>(null);
export type { ErrorContextValue };
