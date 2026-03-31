import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { fetchProducts, prefetchProducts } from '../services/productService';
import { useDebounce } from '@/lib/debounce';
import { useFetch } from '@/lib/useFetch';
import { normalizeError, type AppError } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';
import type { Product } from '../types/product';

type FetchReason = 'initial' | 'filter' | 'page' | 'retry';

interface ProductData {
  products: Product[];
  page: number;
  totalPages: number;
  total: number;
}

interface UseProductsReturn extends ProductData {
  isLoading: boolean;
  isFiltering: boolean;
  isPaginating: boolean;
  isRevalidating: boolean;
  retryStatus: string | null;
  error: AppError | null;
  setPage: (page: number) => void;
  setCategory: (category: string) => void;
  setSearch: (search: string) => void;
  retry: () => void;
  prefetchPage: (page: number) => void;
  category: string;
  search: string;
}

export function useProducts(limit = DEFAULT_PAGE_SIZE): UseProductsReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPageRaw] = useState(Number(searchParams.get('page')) || 1);
  const [category, setCategoryRaw] = useState(searchParams.get('category') || '');
  const [search, setSearchRaw] = useState(searchParams.get('q') || '');
  const [fetchReason, setFetchReason] = useState<FetchReason>('initial');
  const [retryStatus, setRetryStatus] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search);

  // Track previous debounced search to auto-reset page (setState during render pattern)
  const [prevDebounced, setPrevDebounced] = useState(debouncedSearch);

  let effectivePage = page;
  if (prevDebounced !== debouncedSearch) {
    // Search changed — reset to page 1 and update tracking state
    setPrevDebounced(debouncedSearch);
    setPageRaw(1);
    setFetchReason('filter');
    effectivePage = 1;
  }

  // Stable fetch params — drives the single useFetch effect
  const params = useMemo(
    () => ({
      page: effectivePage,
      limit,
      category: category || undefined,
      search: debouncedSearch || undefined,
    }),
    [effectivePage, limit, category, debouncedSearch],
  );

  // Stable fetcher function — won't cause useFetch to re-run on its own
  const fetcher = useCallback(
    async (p: typeof params, signal: { cancelled: boolean }) => {
      setRetryStatus(null);
      const result = await fetchProducts(p, {
        signal,
        onRetry: (attempt, max) => setRetryStatus(`Retrying (${attempt}/${max})...`),
      });
      setRetryStatus(null);

      // Prefetch adjacent pages
      if (result.data.page > 1) prefetchProducts({ ...p, page: p.page! - 1 });
      if (result.data.page < result.data.totalPages) prefetchProducts({ ...p, page: p.page! + 1 });

      return {
        products: result.data.data,
        page: result.data.page,
        totalPages: result.data.totalPages,
        total: result.data.total,
      } satisfies ProductData;
    },
    [], // No deps — params come from the argument, not closure
  );

  // --- Single fetch effect ---
  const { data, error, isFetching, isRevalidating, refetch } = useFetch(params, fetcher);

  // --- URL sync (one useEffect, writes only — never reads/drives state) ---
  useEffect(() => {
    const next = new URLSearchParams();
    if (effectivePage > 1) next.set('page', String(effectivePage));
    if (category) next.set('category', category);
    if (debouncedSearch) next.set('q', debouncedSearch);
    setSearchParams(next, { replace: true });
  }, [effectivePage, category, debouncedSearch, setSearchParams]);

  // --- Event handlers ---
  const setPage = useCallback((p: number) => {
    setFetchReason('page');
    setPageRaw(p);
  }, []);

  const setCategory = useCallback((cat: string) => {
    setFetchReason('filter');
    setCategoryRaw(cat);
    setPageRaw(1);
  }, []);

  const setSearch = useCallback((q: string) => {
    setFetchReason('filter');
    setSearchRaw(q);
  }, []);

  const retry = useCallback(() => {
    setFetchReason('retry');
    refetch();
  }, [refetch]);

  const prefetchPage = useCallback(
    (p: number) => {
      if (p >= 1) prefetchProducts({ ...params, page: p });
    },
    [params],
  );

  // --- Derived loading states ---
  const isInitialOrFilter = fetchReason === 'initial' || fetchReason === 'filter';
  const hasData = (data?.products.length ?? 0) > 0;

  return {
    products: data?.products ?? [],
    page: data?.page ?? effectivePage,
    totalPages: data?.totalPages ?? 1,
    total: data?.total ?? 0,
    isLoading: isFetching && !hasData && isInitialOrFilter,
    isFiltering: isFetching && hasData && isInitialOrFilter,
    isPaginating: isFetching && fetchReason === 'page',
    isRevalidating,
    retryStatus,
    error: error ? normalizeError(error) : null,
    setPage,
    setCategory,
    setSearch,
    retry,
    prefetchPage,
    category,
    search,
  };
}
