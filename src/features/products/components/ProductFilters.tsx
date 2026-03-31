import { memo } from 'react';
import { Search, Package, Loader2 } from 'lucide-react';
import { CATEGORIES } from '@/config/constants';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  total: number;
  isLoading: boolean;
  isFiltering: boolean;
  isPaginating: boolean;
  isRevalidating: boolean;
  hasError: boolean;
}

export const ProductFilters = memo(function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  total,
  isLoading,
  isFiltering,
  isPaginating,
  isRevalidating,
  hasError,
}: ProductFiltersProps) {
  const isBusy = isFiltering || isPaginating;

  return (
    <section className="flex gap-4 mb-8 flex-wrap">
      {/* Search */}
      <div className="glass-panel flex items-center px-4 py-3 flex-1 min-w-[240px] max-w-[400px]">
        {isFiltering ? (
          <Loader2 size={20} className="animate-spin mr-3 shrink-0 text-blue-500" />
        ) : (
          <Search size={20} color="var(--text-muted)" className="mr-3 shrink-0" />
        )}
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <input
          id="product-search"
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search products by name or description"
          className="bg-transparent border-none text-[var(--text-main)] outline-none w-full text-base"
        />
      </div>

      {/* Category Filter */}
      <label htmlFor="category-filter" className="sr-only">Filter by category</label>
      <select
        id="category-filter"
        className="glass-panel px-4 py-3 text-[var(--text-main)] outline-none text-base cursor-pointer appearance-none min-w-[160px]"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        aria-label="Filter by category"
      >
        <option value="" style={{ background: 'var(--surface)' }}>All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat.toLowerCase()} style={{ background: 'var(--surface)' }}>
            {cat}
          </option>
        ))}
      </select>

      {/* Result Count / Status */}
      <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] self-center ml-auto" role="status" aria-live="polite">
        {isBusy ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>{isFiltering ? 'Searching...' : 'Loading page...'}</span>
          </>
        ) : !isLoading && !hasError ? (
          <>
            {isRevalidating ? (
              <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
            ) : (
              <Package size={16} />
            )}
            <span>{total} product{total !== 1 ? 's' : ''} found</span>
          </>
        ) : null}
      </div>
    </section>
  );
});
