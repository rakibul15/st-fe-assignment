import { memo, useState } from 'react';
import { ShoppingCart, ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  /** Index in the grid — first 4 are above-the-fold, loaded eagerly for LCP */
  index?: number;
}

export const ProductCard = memo(function ProductCard({ product, index = 0 }: ProductCardProps) {
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const isAboveFold = index < 4;
  const [imgError, setImgError] = useState(false);

  return (
    <article className="glass-card overflow-hidden flex flex-col" aria-label={product.name}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400" role="img" aria-label={`Image unavailable for ${product.name}`}>
            <ImageOff size={32} />
            <span className="text-xs mt-1">Image unavailable</span>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading={isAboveFold ? 'eager' : 'lazy'}
            decoding={isAboveFold ? 'sync' : 'async'}
            fetchPriority={isAboveFold ? 'high' : 'auto'}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}
        {/* Category Badge */}
        <Badge className="absolute top-3 left-3">{product.category}</Badge>
        {/* Stock Badge */}
        {lowStock && (
          <Badge variant="warning" className="absolute top-3 right-3">
            Only {product.stock} left
          </Badge>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="danger" className="px-4 py-2 text-sm">Out of Stock</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h2 className="text-sm font-semibold text-[var(--text-main)] line-clamp-1">
          {product.name}
        </h2>
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-black/5">
          <div>
            <span className="text-lg font-bold text-[var(--text-main)]">${product.price}</span>
            <span className="text-xs text-[var(--text-muted)] ml-1">.00</span>
          </div>
          <Button
            size="sm"
            disabled={!inStock}
            icon={<ShoppingCart size={14} />}
            aria-label={`Add ${product.name} to cart`}
          >
            Add
          </Button>
        </div>
      </div>
    </article>
  );
});
