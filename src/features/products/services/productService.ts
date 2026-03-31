import { api } from './productApi';
import { fetchWithRetry } from '@/lib/fetcher';
import { createQueryCache, createCacheKey } from '@/lib/cache';
import { errorBus, normalizeError } from '@/lib/errors';
import type { Product, PaginatedResponse, FetchProductsParams } from '../types/product';

// --- Cache ---
const cache = createQueryCache<PaginatedResponse<Product>>({
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  maxSize: 50,
});

// --- Prefetch deduplication ---
const inflight = new Set<string>();

// --- Image preload management ---
const preloadedLinks = new Map<string, HTMLLinkElement>();
const MAX_PRELOADED = 48;

function preloadImages(products: Product[]) {
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (preloadedLinks.has(p.imageUrl)) continue;
    if (preloadedLinks.size >= MAX_PRELOADED) {
      const [url, link] = preloadedLinks.entries().next().value as [string, HTMLLinkElement];
      link.remove();
      preloadedLinks.delete(url);
    }
    const link = document.createElement('link');
    // First 4 images (above-fold) get high-priority preload; rest get prefetch
    link.rel = i < 4 ? 'preload' : 'prefetch';
    link.as = 'image';
    link.href = p.imageUrl;
    document.head.appendChild(link);
    preloadedLinks.set(p.imageUrl, link);
  }
}

function buildKey(params: FetchProductsParams): string {
  return createCacheKey({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 12),
    category: params.category,
    search: params.search,
  });
}

export interface FetchResult {
  data: PaginatedResponse<Product>;
  fromCache: boolean;
  stale: boolean;
}

/**
 * Clean API: fetch products with automatic cache + retry.
 * Returns cached data immediately if available.
 */
export async function fetchProducts(
  params: FetchProductsParams,
  options?: {
    signal?: { cancelled: boolean };
    onRetry?: (attempt: number, max: number) => void;
  },
): Promise<FetchResult> {
  const key = buildKey(params);
  const cached = cache.get(key);

  // Fresh cache → return immediately, skip network
  if (cached && cache.isFresh(key)) {
    return { data: cached, fromCache: true, stale: false };
  }

  // Stale cache → return it, but caller should also revalidate
  if (cached) {
    // Fire background revalidation (non-blocking)
    revalidate(params, key);
    return { data: cached, fromCache: true, stale: true };
  }

  // No cache → fetch from network
  const data = await networkFetch(params, key, options);
  return { data, fromCache: false, stale: false };
}

/**
 * Revalidate: silent background fetch, updates cache.
 * Errors go to global error bus (not thrown).
 */
async function revalidate(params: FetchProductsParams, key: string): Promise<void> {
  if (inflight.has(key)) return;
  inflight.add(key);

  try {
    const result = await api.fetchProducts(params);
    cache.set(key, result);
    preloadImages(result.data);
  } catch {
    // Silent — stale data already shown, no user disruption
  } finally {
    inflight.delete(key);
  }
}

/**
 * Network fetch with retry. Throws on failure.
 */
async function networkFetch(
  params: FetchProductsParams,
  key: string,
  options?: {
    signal?: { cancelled: boolean };
    onRetry?: (attempt: number, max: number) => void;
  },
): Promise<PaginatedResponse<Product>> {
  try {
    const result = await fetchWithRetry(() => api.fetchProducts(params), options);
    cache.set(key, result);
    preloadImages(result.data);
    return result;
  } catch (err) {
    // Emit to global error bus for toast notification
    errorBus.emit(normalizeError(err));
    throw err;
  }
}

/**
 * Prefetch a page: silent, deduped, non-blocking.
 */
export function prefetchProducts(params: FetchProductsParams): void {
  const key = buildKey(params);
  if (cache.get(key) || inflight.has(key)) return;

  inflight.add(key);
  api
    .fetchProducts(params)
    .then((result) => {
      cache.set(key, result);
      preloadImages(result.data);
    })
    .catch(() => { /* silent */ })
    .finally(() => inflight.delete(key));
}

/**
 * Check if a set of params has fresh cached data.
 */
export function hasFreshCache(params: FetchProductsParams): boolean {
  return cache.isFresh(buildKey(params));
}
