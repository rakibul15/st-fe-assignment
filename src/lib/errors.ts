export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN';

export interface AppError {
  code: ErrorCode;
  message: string;
  status?: number;
  detail?: unknown;
  retryable: boolean;
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      code: 'TIMEOUT',
      message: 'Request timed out. Please try again.',
      retryable: true,
    };
  }

  if (error instanceof TypeError) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect. Please check your internet connection.',
      retryable: true,
    };
  }

  if (
    error instanceof Error &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    const status = (error as { status: number }).status;
    if (status === 404) {
      return { code: 'NOT_FOUND', message: 'Resource not found.', status, retryable: false };
    }
    if (status >= 400 && status < 500) {
      return { code: 'VALIDATION_ERROR', message: 'Invalid request.', status, retryable: false };
    }
    if (status >= 500) {
      return { code: 'SERVER_ERROR', message: 'Server error. Please try again.', status, retryable: true };
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('load failed')) {
      return { code: 'NETWORK_ERROR', message: error.message, detail: error, retryable: true };
    }
    return { code: 'SERVER_ERROR', message: error.message, detail: error, retryable: true };
  }

  return { code: 'UNKNOWN', message: 'An unexpected error occurred.', detail: error, retryable: false };
}

// --- Global error event bus ---
type ErrorListener = (error: AppError) => void;
const listeners = new Set<ErrorListener>();

export const errorBus = {
  subscribe(fn: ErrorListener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  emit(error: AppError) {
    listeners.forEach((fn) => fn(error));
  },
};
