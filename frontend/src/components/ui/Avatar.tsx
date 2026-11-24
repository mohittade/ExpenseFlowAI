import { HTMLAttributes, forwardRef, useMemo } from 'react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const sizeClasses = {
  xs: 'avatar-xs',
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl',
};

const statusSizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
};

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  busy: 'bg-danger-500',
  away: 'bg-warning-500',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = '', src, alt, name, size = 'md', status, ...props }, ref) => {
    const initials = useMemo(() => {
      if (!name) return '?';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [name]);

    const hasImage = src && src.length > 0;

    return (
      <div
        ref={ref}
        className={`avatar ${sizeClasses[size]} relative ${className}`}
        {...props}
      >
        {hasImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="avatar-image rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`avatar-fallback rounded-full ${hasImage ? 'hidden' : ''}`}
          aria-hidden="true"
        >
          {initials}
        </div>
        {status && (
          <span
            className={`absolute bottom-0 right-0 rounded-full border-2 border-surface ${statusSizeClasses[size]} ${statusColors[status]}`}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className = '', children, max = 5, size = 'md', ...props }, ref) => {
    const kids = Array.isArray(children) ? children : [children];
    const visible = kids.slice(0, max);
    const remaining = kids.length - max;

    return (
      <div
        ref={ref}
        className={`flex -space-x-2 ${className}`}
        {...props}
      >
        {visible.map((child, index) =>
          React.cloneElement(child as React.ReactElement<any>, {
            key: index,
            size,
            className: 'ring-2 ring-surface',
          })
        )}
        {remaining > 0 && (
          <div
            className={`avatar ${sizeClasses[size]} bg-neutral-100 text-neutral-600 ring-2 ring-surface flex-shrink-0`}
            aria-label={`${remaining} more people`}
          >
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

import React from 'react';