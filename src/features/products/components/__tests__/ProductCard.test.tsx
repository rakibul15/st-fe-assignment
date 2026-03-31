import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';
import type { Product } from '../../types/product';

const baseProduct: Product = {
  id: 'prod-1',
  name: 'Test Product',
  description: 'A great product for testing',
  price: 99,
  category: 'Electronics',
  imageUrl: 'https://example.com/img.jpg',
  stock: 10,
};

describe('ProductCard', () => {
  it('renders product name, description, and price', () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('A great product for testing')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('shows low stock warning when stock <= 5', () => {
    render(<ProductCard product={{ ...baseProduct, stock: 3 }} />);
    expect(screen.getByText('Only 3 left')).toBeInTheDocument();
  });

  it('shows out of stock overlay when stock is 0', () => {
    render(<ProductCard product={{ ...baseProduct, stock: 0 }} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('disables Add button when out of stock', () => {
    render(<ProductCard product={{ ...baseProduct, stock: 0 }} />);
    const button = screen.getByRole('button', { name: /add test product to cart/i });
    expect(button).toBeDisabled();
  });

  it('enables Add button when in stock', () => {
    render(<ProductCard product={baseProduct} />);
    const button = screen.getByRole('button', { name: /add test product to cart/i });
    expect(button).toBeEnabled();
  });

  it('uses eager loading for above-fold images (index < 4)', () => {
    render(<ProductCard product={baseProduct} index={0} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('uses lazy loading for below-fold images (index >= 4)', () => {
    render(<ProductCard product={baseProduct} index={5} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('shows fallback when image fails to load', () => {
    render(<ProductCard product={baseProduct} />);
    const img = screen.getByRole('img', { name: 'Test Product' });
    fireEvent.error(img);
    expect(screen.getByText('Image unavailable')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /image unavailable for test product/i })).toBeInTheDocument();
  });
});
