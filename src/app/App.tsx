import { useProducts, ProductFilters, ProductGrid, Pagination } from '@/features/products';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  const {
    products,
    isLoading,
    isFiltering,
    isPaginating,
    isRevalidating,
    retryStatus,
    error,
    page,
    totalPages,
    total,
    setPage,
    setCategory,
    setSearch,
    retry,
    prefetchPage,
    category,
    search,
  } = useProducts();

  const showPagination = !isLoading && !isFiltering && !error && products.length > 0;

  return (
    <div className="min-h-screen p-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <header className="glass-panel p-8 mb-8">
        <h1 className="text-3xl font-semibold mb-2">Premium Products</h1>
        <p className="text-[var(--text-muted)]">
          Browse our curated collection of premium products.
        </p>
      </header>

      {/* Filters — always interactive, even during errors */}
      <ErrorBoundary
        fallback={<div className="text-sm text-red-500 mb-4">Filter controls failed to load.</div>}
      >
        <ProductFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          total={total}
          isLoading={isLoading}
          isFiltering={isFiltering}
          isPaginating={isPaginating}
          isRevalidating={isRevalidating}
          hasError={!!error}
        />
      </ErrorBoundary>

      {/* Main Content */}
      <main id="main-content">
        <ErrorBoundary
          fallback={(err, reset) => (
            <div className="glass-panel flex flex-col items-center justify-center py-12 px-6 text-center">
              <h2 className="text-lg font-semibold text-[var(--text-main)] mb-1">Something went wrong</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">{err.message}</p>
              <button onClick={reset} className="btn-primary">Try Again</button>
            </div>
          )}
        >
          <ProductGrid
            products={products}
            isLoading={isLoading}
            isFiltering={isFiltering}
            isPaginating={isPaginating}
            error={error}
            retryStatus={retryStatus}
            onRetry={retry}
          />
        </ErrorBoundary>

        {showPagination && (
          <div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onPrefetch={prefetchPage}
              disabled={isPaginating}
            />
            <p className="text-center text-xs text-[var(--text-muted)] mt-3">
              Page {page} of {totalPages}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
