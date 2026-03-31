import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductGrid } from '../ProductGrid';
import type { Product } from '../../types/product';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => {
  const div = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const { custom, variants, initial, animate, exit, ...htmlProps } = props;
    void custom; void variants; void initial; void animate; void exit;
    return <div {...htmlProps}>{children}</div>;
  };
  return {
    motion: { div },
    m: { div },
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
    LazyMotion: ({ children }: React.PropsWithChildren) => children,
    domAnimation: {},
  };
});

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Product One',
    description: 'Description one',
    price: 100,
    category: 'Electronics',
    imageUrl: 'https://example.com/1.jpg',
    stock: 10,
  },
  {
    id: 'prod-2',
    name: 'Product Two',
    description: 'Description two',
    price: 200,
    category: 'Clothing',
    imageUrl: 'https://example.com/2.jpg',
    stock: 5,
  },
];

const defaultProps = {
  products: mockProducts,
  isLoading: false,
  isFiltering: false,
  isPaginating: false,
  error: null,
  retryStatus: null,
  onRetry: vi.fn(),
};

describe('ProductGrid', () => {
  it('renders product cards when data is loaded', () => {
    render(<ProductGrid {...defaultProps} />);

    expect(screen.getByText('Product One')).toBeInTheDocument();
    expect(screen.getByText('Product Two')).toBeInTheDocument();
  });

  it('renders skeleton grid during initial loading', () => {
    render(<ProductGrid {...defaultProps} products={[]} isLoading={true} />);

    expect(screen.getByRole('status', { name: 'Loading products' })).toBeInTheDocument();
  });

  it('renders skeleton grid during filtering', () => {
    render(<ProductGrid {...defaultProps} isFiltering={true} />);

    expect(screen.getByRole('status', { name: 'Loading products' })).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    const onRetry = vi.fn();
    render(
      <ProductGrid
        {...defaultProps}
        products={[]}
        error={{ code: 'SERVER_ERROR', message: 'Server failed', retryable: true }}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Server failed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders network error state with specific message', () => {
    render(
      <ProductGrid
        {...defaultProps}
        products={[]}
        error={{ code: 'NETWORK_ERROR', message: 'No connection', retryable: true }}
      />,
    );

    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
  });

  it('renders empty state when no products', () => {
    render(<ProductGrid {...defaultProps} products={[]} />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('shows retry status message during loading', () => {
    render(
      <ProductGrid {...defaultProps} products={[]} isLoading={true} retryStatus="Retrying (1/3)..." />,
    );

    expect(screen.getByText('Retrying (1/3)...')).toBeInTheDocument();
  });

  it('renders product list with correct role', () => {
    render(<ProductGrid {...defaultProps} />);

    expect(screen.getByRole('list', { name: 'Product listing' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
