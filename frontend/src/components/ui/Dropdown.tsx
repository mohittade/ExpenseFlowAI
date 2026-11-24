import { useState, useRef, useEffect, ReactNode, forwardRef, HTMLAttributes } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Button } from './Button';

interface DropdownItem {
  label: ReactNode;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode | ((state: { open: boolean; onToggle: () => void }) => ReactNode);
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown = ({ trigger, items, align = 'right', className = '' }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setOpen(false);
  };

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      <div ref={triggerRef}>
        {typeof trigger === 'function' ? trigger({ open, onToggle: () => setOpen(!open) }) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="gap-1"
            ref={triggerRef as any}
          >
            {trigger}
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </Button>
        )}
      </div>

      {open && (
        <div
          className={`dropdown-menu ${align === 'left' ? 'left-0' : 'right-0'}`}
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => handleItemClick(item.onClick)}
              disabled={item.disabled}
              className={`dropdown-item ${item.danger ? 'dropdown-item-danger' : ''} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface DropdownDividerProps extends HTMLAttributes<HTMLHRElement> {}

export const DropdownDivider = forwardRef<HTMLHRElement, DropdownDividerProps>(
  ({ className = '', ...props }, ref) => (
    <hr
      ref={ref}
      className={`dropdown-divider ${className}`}
      {...props}
    />
  )
);

DropdownDivider.displayName = 'DropdownDivider';