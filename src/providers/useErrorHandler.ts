import { useContext } from 'react';
import { ErrorContext } from './ErrorContext';

export function useErrorHandler() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error('useErrorHandler must be used within ErrorProvider');
  return ctx;
}
