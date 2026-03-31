import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByLabelText('Go to page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to page 5')).toBeInTheDocument();
  });

  it('marks current page with aria-current', () => {
    render(<Pagination page={3} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByLabelText('Go to page 3')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByLabelText('Go to page 1')).not.toHaveAttribute('aria-current');
  });

  it('disables previous button on first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });

  it('calls onPageChange when page button clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByLabelText('Go to page 3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when next button clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when previous button clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByLabelText('Previous page'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables all buttons when disabled prop is true', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} disabled />);

    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    expect(screen.getByLabelText('Next page')).toBeDisabled();
    expect(screen.getByLabelText('Go to page 1')).toBeDisabled();
  });

  it('calls onPrefetch on hover', async () => {
    const onPrefetch = vi.fn();
    render(
      <Pagination page={2} totalPages={5} onPageChange={vi.fn()} onPrefetch={onPrefetch} />,
    );

    await userEvent.hover(screen.getByLabelText('Go to page 3'));
    expect(onPrefetch).toHaveBeenCalledWith(3);
  });

  it('shows ellipsis for many pages', () => {
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);

    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });
});
