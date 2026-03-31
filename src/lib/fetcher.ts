import { MAX_RETRIES, RETRY_DELAY } from '@/config/constants';

interface FetchWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  /** Total timeout for all attempts (ms). Default: 30s */
  maxTimeout?: number;
  signal?: { cancelled: boolean };
  /** Called before each retry — show "Retrying 2/3..." */
  onRetry?: (attempt: number, maxRetries: number) => void;
}

export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: FetchWithRetryOptions = {},
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    maxTimeout = 30_000,
    signal,
    onRetry,
  } = options;

  const startTime = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check cancellation
    if (signal?.cancelled) {
      throw new DOMException('Request was cancelled', 'AbortError');
    }

    // Check total timeout
    if (Date.now() - startTime > maxTimeout) {
      throw new DOMException('Request timed out', 'AbortError');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, maxRetries);

        // Exponential backoff + jitter to prevent thundering herd
        const exponential = retryDelay * Math.pow(2, attempt);
        const jitter = Math.random() * exponential * 0.5;
        const delay = Math.min(exponential + jitter, 10_000); // Cap at 10s

        await new Promise((r) => setTimeout(r, delay));

        // Re-check after waiting
        if (signal?.cancelled) {
          throw new DOMException('Request was cancelled', 'AbortError');
        }
        if (Date.now() - startTime > maxTimeout) {
          throw new DOMException('Request timed out', 'AbortError');
        }
      }
    }
  }

  throw lastError;
}
