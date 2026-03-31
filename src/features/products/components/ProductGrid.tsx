import { useState, useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Package, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProductCard } from './ProductCard';
import type { AppError } from '@/lib/errors';
import type { Product } from '../types/product';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  isFiltering: boolean;
  isPaginating: boolean;
  error: AppError | null;
  retryStatus: string | null;
  onRetry: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.04,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.15 },
  },
};

const errorIcons: Record<string, typeof AlertTriangle> = {
  NETWORK_ERROR: WifiOff,
  TIMEOUT: WifiOff,
  SERVER_ERROR: AlertTriangle,
  NOT_FOUND: Package,
  VALIDATION_ERROR: AlertTriangle,
  UNKNOWN: AlertTriangle,
};

export function ProductGrid({
  products,
  isLoading,
  isFiltering,
  isPaginating,
  error,
  retryStatus,
  onRetry,
}: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [prevCount, setPrevCount] = useState(12);
  const [prevProducts, setPrevProducts] = useState(products);

  // Track last known product count for skeleton matching (setState during render pattern)
  if (products !== prevProducts) {
    setPrevProducts(products);
    if (products.length > 0) {
      setPrevCount(products.length);
    }
  }

  // Scroll to top on page change
  useEffect(() => {
    if (!isPaginating && !isLoading && products.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [products.length, isPaginating, isLoading]);

  // Initial load
  if (isLoading) {
    return (
      <div>
        {retryStatus && (
          <p className="text-center text-sm text-amber-600 mb-4 animate-pulse">{retryStatus}</p>
        )}
        <ProductGridSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    const Icon = errorIcons[error.code] || AlertTriangle;
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel flex flex-col items-center justify-center py-12 px-6 text-center"
      >
        <Icon size={40} className="text-[var(--error)] mb-3" />
        <h2 className="text-lg font-semibold text-[var(--text-main)] mb-1">
          {error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT'
            ? 'Connection Problem'
            : 'Something went wrong'}
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-1 max-w-md">{error.message}</p>
        <p className="text-xs text-[var(--text-muted)] mb-4">Error code: {error.code}</p>
        {error.retryable && (
          <Button onClick={onRetry} icon={<RefreshCw size={16} />}>
            Try Again
          </Button>
        )}
      </m.div>
    );
  }

  // Filter/search changed — skeleton matching previous count
  if (isFiltering) {
    return <ProductGridSkeleton count={prevCount} />;
  }

  // Empty state
  if (products.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel flex flex-col items-center justify-center py-12 px-6 text-center"
      >
        <Package size={40} className="text-[var(--text-muted)] mb-3" />
        <h2 className="text-lg font-semibold text-[var(--text-main)] mb-1">No products found</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Try adjusting your search or filter to find what you're looking for.
        </p>
      </m.div>
    );
  }

  // Paginating — progress bar + skeleton matching current count
  if (isPaginating) {
    return (
      <div ref={gridRef}>
        <ProgressBar />
        {retryStatus && (
          <p className="text-center text-sm text-amber-600 mb-4">{retryStatus}</p>
        )}
        <ProductGridSkeleton count={products.length} />
      </div>
    );
  }

  // Data loaded — staggered cards
  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
      role="list"
      aria-label="Product listing"
    >
      <AnimatePresence mode="popLayout">
        {products.map((product, i) => (
          <m.div
            key={product.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="listitem"
          >
            <ProductCard product={product} index={i} />
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
