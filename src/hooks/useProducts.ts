import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import type { Product, PaginatedResponse } from '../types/product';

interface UseProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
}

interface UseProductsReturn extends UseProductsState {
  setPage: (page: number) => void;
  setCategory: (category: string) => void;
  setSearch: (search: string) => void;
  retry: () => void;
  category: string;
  search: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const DEBOUNCE_MS = 400;

export function useProducts(limit = 12): UseProductsReturn {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    loading: true,
    error: null,
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const abortRef = useRef(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // Reset to page 1 when search changes
      setState(prev => ({ ...prev, page: 1 }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when category changes
  const handleSetCategory = useCallback((cat: string) => {
    setCategory(cat);
    setState(prev => ({ ...prev, page: 1 }));
  }, []);

  const fetchWithRetry = useCallback(
    async (page: number, attempt = 0, fetchId: number): Promise<void> => {
      // If a newer fetch was initiated, abort this one
      if (fetchId !== abortRef.current) return;

      if (attempt === 0) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      try {
        const result: PaginatedResponse<Product> = await api.fetchProducts({
          page,
          limit,
          category: category || undefined,
          search: debouncedSearch || undefined,
        });

        // Check if still the latest fetch
        if (fetchId !== abortRef.current) return;

        setState({
          products: result.data,
          loading: false,
          error: null,
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        });
      } catch (err) {
        if (fetchId !== abortRef.current) return;

        if (attempt < MAX_RETRIES) {
          // Exponential backoff
          await new Promise(r => setTimeout(r, RETRY_DELAY * Math.pow(2, attempt)));
          if (fetchId !== abortRef.current) return;
          return fetchWithRetry(page, attempt + 1, fetchId);
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'An unexpected error occurred.',
        }));
      }
    },
    [limit, category, debouncedSearch],
  );

  useEffect(() => {
    const fetchId = ++abortRef.current;
    fetchWithRetry(state.page, 0, fetchId);
  }, [state.page, fetchWithRetry]);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, page }));
  }, []);

  const retry = useCallback(() => {
    const fetchId = ++abortRef.current;
    fetchWithRetry(state.page, 0, fetchId);
  }, [state.page, fetchWithRetry]);

  return {
    ...state,
    setPage,
    setCategory: handleSetCategory,
    setSearch,
    retry,
    category,
    search,
  };
}
