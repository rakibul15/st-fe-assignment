import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrefetch?: (page: number) => void;
  /** Disable all buttons (e.g. during pagination fetch) */
  disabled?: boolean;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

export function Pagination({ page, totalPages, onPageChange, onPrefetch, disabled = false }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  const handleHover = (targetPage: number) => {
    if (!disabled && targetPage >= 1 && targetPage <= totalPages && targetPage !== page) {
      onPrefetch?.(targetPage);
    }
  };

  const btnBase = 'flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const btnDefault = `${btnBase} border border-[var(--border)] bg-[var(--glass-card-bg)] backdrop-blur-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]`;
  const btnActive = `${btnBase} bg-[var(--primary)] text-white shadow-sm`;

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1.5 mt-8 transition-opacity duration-200 ${disabled ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => onPageChange(page - 1)}
        onMouseEnter={() => handleHover(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        className={btnDefault}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-[var(--text-muted)] text-sm" aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            onMouseEnter={() => handleHover(p)}
            disabled={disabled || p === page}
            aria-label={`Go to page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={p === page ? btnActive : btnDefault}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        onMouseEnter={() => handleHover(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
        className={btnDefault}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
