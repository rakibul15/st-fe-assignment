import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

// Mock the API to be deterministic — no random delays or failures
vi.mock('../../services/productApi', () => {
  const mockProducts = Array.from({ length: 30 }, (_, i) => ({
    id: `prod-${i + 1}`,
    name: `Product ${i + 1}`,
    description: `Description for product ${i + 1}`,
    price: (i + 1) * 10,
    category: ['Electronics', 'Clothing', 'Home', 'Outdoors'][i % 4],
    imageUrl: `https://example.com/${i + 1}.jpg`,
    stock: i + 1,
  }));

  return {
    api: {
      fetchProducts: vi.fn(async (params: { page?: number; limit?: number; category?: string; search?: string }) => {
        const { page = 1, limit = 12, category, search } = params;
        let filtered = mockProducts;

        if (category) {
          filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
        }
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s),
          );
        }

        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const data = filtered.slice((page - 1) * limit, page * limit);

        return { data, total, page, limit, totalPages };
      }),
    },
  };
});

// Mock document.createElement for image prefetching
const origCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  const el = origCreateElement(tag);
  if (tag === 'link') {
    el.remove = vi.fn();
  }
  return el;
});
vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node);

import { useProducts } from '../useProducts';

function wrapper({ children }: { children: ReactNode }) {
  return createElement(MemoryRouter, null, children);
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products on initial render', async () => {
    const { result } = renderHook(() => useProducts(12), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products.length).toBe(12);
    expect(result.current.total).toBe(30);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(3);
  });

  it('filters by category', async () => {
    const { result } = renderHook(() => useProducts(12), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change category
    act(() => {
      result.current.setCategory('electronics');
    });

    // Wait for filtered results to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFiltering).toBe(false);
      expect(result.current.category).toBe('electronics');
      expect(result.current.products.length).toBeGreaterThan(0);
      expect(result.current.products.every((p) => p.category === 'Electronics')).toBe(true);
    });
  });

  it('resets page to 1 when category changes', async () => {
    const { result } = renderHook(() => useProducts(12), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Go to page 2
    act(() => { result.current.setPage(2); });

    await waitFor(() => {
      expect(result.current.page).toBe(2);
    });

    // Change category — should reset to page 1
    act(() => { result.current.setCategory('clothing'); });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
    });
  });

  it('paginates correctly', async () => {
    const { result } = renderHook(() => useProducts(12), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstPageProducts = [...result.current.products];

    act(() => { result.current.setPage(2); });

    await waitFor(() => {
      expect(result.current.page).toBe(2);
    });

    // Page 2 products should be different from page 1
    expect(result.current.products[0]?.id).not.toBe(firstPageProducts[0]?.id);
  });

  it('exposes retry function', async () => {
    const { result } = renderHook(() => useProducts(12), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Just verify retry is callable and doesn't throw
    act(() => { result.current.retry(); });

    await waitFor(() => {
      expect(result.current.products.length).toBeGreaterThan(0);
    });
  });
});
