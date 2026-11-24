import { HTMLAttributes, forwardRef } from 'react';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, size = 'md', showLabel = false, className = '', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: 'h-1.5',
      md: 'h-2',
      lg: 'h-3',
    };

    return (
      <div
        ref={ref}
        className={`w-full bg-neutral-200 rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        <div
          className="h-full bg-primary-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
        {showLabel && (
          <span className="sr-only">{Math.round(percentage)}% complete</span>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularProgress = ({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  className = '',
}: CircularProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={`transform -rotate-90 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-neutral-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary-600 transition-all duration-500 ease-out"
        style={{ strokeDashoffset: offset }}
      />
    </svg>
  );
};