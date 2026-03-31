import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductFilters } from '../ProductFilters';

const defaultProps = {
  search: '',
  onSearchChange: vi.fn(),
  category: '',
  onCategoryChange: vi.fn(),
  total: 42,
  isLoading: false,
  isFiltering: false,
  isPaginating: false,
  isRevalidating: false,
  hasError: false,
};

describe('ProductFilters', () => {
  it('renders search input and category select', () => {
    render(<ProductFilters {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
  });

  it('displays product count', () => {
    render(<ProductFilters {...defaultProps} total={42} />);
    expect(screen.getByText('42 products found')).toBeInTheDocument();
  });

  it('displays singular form for 1 product', () => {
    render(<ProductFilters {...defaultProps} total={1} />);
    expect(screen.getByText('1 product found')).toBeInTheDocument();
  });

  it('calls onSearchChange when user types', async () => {
    const onSearchChange = vi.fn();
    render(<ProductFilters {...defaultProps} onSearchChange={onSearchChange} />);

    const input = screen.getByPlaceholderText('Search products...');
    await userEvent.type(input, 'phone');

    expect(onSearchChange).toHaveBeenCalledTimes(5); // p-h-o-n-e
  });

  it('calls onCategoryChange when category selected', async () => {
    const onCategoryChange = vi.fn();
    render(<ProductFilters {...defaultProps} onCategoryChange={onCategoryChange} />);

    const select = screen.getByLabelText('Filter by category');
    await userEvent.selectOptions(select, 'electronics');

    expect(onCategoryChange).toHaveBeenCalledWith('electronics');
  });

  it('shows "Searching..." status when filtering', () => {
    render(<ProductFilters {...defaultProps} isFiltering={true} />);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows "Loading page..." status when paginating', () => {
    render(<ProductFilters {...defaultProps} isPaginating={true} />);
    expect(screen.getByText('Loading page...')).toBeInTheDocument();
  });

  it('renders all category options', () => {
    render(<ProductFilters {...defaultProps} />);
    const select = screen.getByLabelText('Filter by category');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(5); // All Categories + 4 categories
    expect(options[0]).toHaveTextContent('All Categories');
    expect(options[1]).toHaveTextContent('Electronics');
    expect(options[2]).toHaveTextContent('Clothing');
    expect(options[3]).toHaveTextContent('Home');
    expect(options[4]).toHaveTextContent('Outdoors');
  });
});
