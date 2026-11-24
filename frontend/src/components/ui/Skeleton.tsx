import { HTMLAttributes, forwardRef } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = '', variant = 'text', width, height, lines = 1, ...props }, ref) => {
    const baseClasses = 'animate-pulse bg-neutral-200 rounded';

    const variantClasses = {
      text: 'h-4',
      circular: 'rounded-full',
      rectangular: '',
    };

    if (variant === 'text' && lines > 1) {
      return (
        <div ref={ref} className={className} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`${baseClasses} ${variantClasses[variant]} mb-2`}
              style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className = '' }: SkeletonCardProps) => (
  <div className={`card ${className}`}>
    <div className="card-header">
      <Skeleton variant="rectangular" width="40%" height={24} />
      <Skeleton variant="text" width="60%" height={16} className="mt-2" />
    </div>
    <div className="card-body space-y-4">
      <Skeleton variant="text" width="100%" lines={3} />
      <Skeleton variant="rectangular" width="100%" height={100} />
    </div>
  </div>
);

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable = ({ rows = 5, columns = 5, className = '' }: SkeletonTableProps) => (
  <div className={`table-container ${className}`}>
    <table className="table" role="table">
      <thead className="table-header">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="table-header-cell">
              <Skeleton variant="text" width="80%" height={12} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="table-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="table-row">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="table-cell">
                <Skeleton variant="text" width="60%" height={16} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);