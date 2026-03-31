interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col" aria-hidden="true">
      {/* Image placeholder */}
      <Skeleton className="aspect-[4/3] rounded-none" />

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        {/* Description line 1 */}
        <Skeleton className="h-3 w-full" />
        {/* Description line 2 */}
        <Skeleton className="h-3 w-2/3" />

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-black/5">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 12 }: ProductGridSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading products...</span>
    </div>
  );
}
