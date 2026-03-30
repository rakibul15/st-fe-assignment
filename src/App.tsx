import { Search, Loader2, AlertTriangle, RefreshCw, Package } from 'lucide-react';
import { useProducts } from './hooks/useProducts';
import { ProductCard } from './components/ProductCard';
import { Pagination } from './components/Pagination';

function App() {
  const {
    products,
    loading,
    error,
    page,
    totalPages,
    total,
    setPage,
    setCategory,
    setSearch,
    retry,
    category,
    search,
  } = useProducts(12);

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Section */}
      <header className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Premium Products
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Browse our curated collection of premium products.
        </p>
      </header>

      {/* Controls Section */}
      <section style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
          <Search size={20} color="var(--text-muted)" style={{ marginRight: '0.75rem', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              outline: 'none',
              width: '100%',
              fontSize: '1rem',
            }}
          />
        </div>

        <select
          className="glass-panel"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          style={{
            padding: '0.75rem 1rem',
            color: 'var(--text-main)',
            outline: 'none',
            fontSize: '1rem',
            cursor: 'pointer',
            appearance: 'none',
            minWidth: '160px',
          }}
        >
          <option value="" style={{ background: 'var(--surface)' }}>All Categories</option>
          <option value="electronics" style={{ background: 'var(--surface)' }}>Electronics</option>
          <option value="clothing" style={{ background: 'var(--surface)' }}>Clothing</option>
          <option value="home" style={{ background: 'var(--surface)' }}>Home</option>
          <option value="outdoors" style={{ background: 'var(--surface)' }}>Outdoors</option>
        </select>

        {/* Result count */}
        {!loading && !error && (
          <div className="flex items-center gap-1.5 text-sm text-slate-500 self-center ml-auto">
            <Package size={16} />
            <span>{total} product{total !== 1 ? 's' : ''} found</span>
          </div>
        )}
      </section>

      {/* Main Content */}
      <main>
        {/* Loading State */}
        {loading && (
          <div
            className="flex flex-col items-center justify-center py-16"
            role="status"
            aria-label="Loading products"
          >
            <Loader2
              size={40}
              color="var(--primary)"
              className="animate-spin"
              style={{ marginBottom: '1rem' }}
            />
            <p className="text-slate-500 text-sm">Fetching products...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="glass-panel flex flex-col items-center justify-center py-12 px-6 text-center">
            <AlertTriangle size={40} className="text-red-500 mb-3" />
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-4 max-w-md">{error}</p>
            <button
              onClick={retry}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="glass-panel flex flex-col items-center justify-center py-12 px-6 text-center">
            <Package size={40} className="text-slate-400 mb-3" />
            <h2 className="text-lg font-semibold text-slate-800 mb-1">No products found</h2>
            <p className="text-sm text-slate-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            {/* Page info */}
            <p className="text-center text-xs text-slate-400 mt-3">
              Page {page} of {totalPages}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
