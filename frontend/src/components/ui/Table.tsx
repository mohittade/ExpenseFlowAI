import { HTMLAttributes, forwardRef, ReactNode } from 'react';

type SortDirection = 'asc' | 'desc' | 'none';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  loadingRows?: number;
  sortState?: { column: string; direction: SortDirection };
  onSort?: (column: string) => void;
  getSortIcon?: (column: string) => ReactNode | null;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  emptyIcon,
  striped = true,
  hoverable = true,
  className = '',
  onRowClick,
  loading = false,
  loadingRows = 5,
  sortState,
  onSort,
  getSortIcon,
}: TableProps<T>) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (loading) {
    return (
      <div className={`table-container ${className}`}>
        <table className="table" role="table">
          <thead className="table-header">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`table-header-cell ${alignClasses[col.align || 'left']} ${col.headerClassName || ''}`}
                >
                  <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4" aria-hidden="true" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-body">
            {Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className={`table-row ${striped && i % 2 === 1 ? 'bg-neutral-50' : ''}`}>
                {columns.map((col) => (
                  <td key={col.key} className={`table-cell ${alignClasses[col.align || 'left']} ${col.className || ''}`}>
                    <div className="h-4 bg-neutral-200 rounded animate-pulse w-1/2" aria-hidden="true" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`table-container ${className}`}>
        <div className="card p-12 text-center">
          {emptyIcon && <div className="w-12 h-12 mx-auto mb-4 text-text-tertiary">{emptyIcon}</div>}
          <p className="text-text-secondary">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="table" role="table">
        <thead className="table-header">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`table-header-cell ${alignClasses[col.align || 'left']} ${col.headerClassName || ''} ${sortState?.column === col.key ? 'cursor-pointer select-none' : ''}`}
                onClick={() => onSort?.(col.key)}
              >
                <div className="flex items-center gap-1.5">
                  {col.header}
                  {sortState?.column === col.key && sortState.direction !== 'none' && (
                    <span className="flex-shrink-0">{getSortIcon?.(col.key)}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {data.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row, rowIndex)}
              className={`table-row ${striped && rowIndex % 2 === 1 ? 'bg-neutral-50' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={`table-cell ${alignClasses[col.align || 'left']} ${col.className || ''}`}>
                  {col.render(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showTotal?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showTotal = true,
  totalItems = 0,
  itemsPerPage = 10,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav
      className={`flex items-center justify-between px-4 py-3 border-t border-border-default ${className}`}
      aria-label="Pagination"
    >
      {showTotal && totalItems > 0 && (
        <div className="text-body-sm text-text-secondary">
          Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span>{' '}
          of <span className="font-medium">{totalItems}</span> results
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="btn-ghost btn-sm p-2"
          aria-label="First page"
          aria-disabled={currentPage === 1}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-ghost btn-sm p-2"
          aria-label="Previous page"
          aria-disabled={currentPage === 1}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {start > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="btn-ghost btn-sm"
              aria-label="Page 1"
            >
              1
            </button>
            {start > 2 && (
              <span className="px-2 text-text-tertiary" aria-hidden="true">...</span>
            )}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`btn ${page === currentPage ? 'btn-primary' : 'btn-ghost'} btn-sm min-w-[40px]`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-2 text-text-tertiary" aria-hidden="true">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="btn-ghost btn-sm"
              aria-label={`Page ${totalPages}`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-ghost btn-sm p-2"
          aria-label="Next page"
          aria-disabled={currentPage === totalPages}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="btn-ghost btn-sm p-2"
          aria-label="Last page"
          aria-disabled={currentPage === totalPages}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7m-8-14l7 7-7 7" />
          </svg>
        </button>
      </div>
    </nav>
  );
};