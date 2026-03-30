import { ShoppingCart } from 'lucide-react';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article className="glass-card overflow-hidden flex flex-col" role="article" aria-label={product.name}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded-full bg-white/80 backdrop-blur-sm text-slate-700 border border-black/5">
          {product.category}
        </span>
        {/* Stock Badge */}
        {lowStock && (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/90 text-white backdrop-blur-sm">
            Only {product.stock} left
          </span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-4 py-2 text-sm font-semibold rounded-full bg-white/90 text-slate-800">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-black/5">
          <div>
            <span className="text-lg font-bold text-slate-900">${product.price}</span>
            <span className="text-xs text-slate-400 ml-1">.00</span>
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inStock}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
