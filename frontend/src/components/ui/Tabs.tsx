import { useState, ReactNode, forwardRef, HTMLAttributes } from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills';
}

export const Tabs = ({ tabs, activeTab, onChange, className = '', variant = 'default' }: TabsProps) => {
  if (variant === 'pills') {
    return (
      <div className={`tabs ${className}`} role="tablist" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {tab.icon && <span className="w-4 h-4 mr-2 flex-shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 px-1.5 py-0.5 text-caption font-medium bg-primary-100 text-primary-700 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex border-b border-border-default ${className}`} role="tablist" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={`px-4 py-3 text-body-sm font-medium transition-colors duration-150
            ${activeTab === tab.id
              ? 'text-text-primary border-b-2 border-primary-600 -mb-px'
              : 'text-text-secondary hover:text-text-primary'}
            ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {tab.icon && <span className="w-4 h-4 mr-2 flex-shrink-0">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 px-1.5 py-0.5 text-caption font-medium bg-primary-100 text-primary-700 rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  active: boolean;
}

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ id, active, children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      id={id}
      role="tabpanel"
      aria-labelledby={`tab-${id.replace('panel-', '')}`}
      hidden={!active}
      className={`animate-fade-in ${className}`}
      {...props}
    >
      {active && children}
    </div>
  )
);

TabPanel.displayName = 'TabPanel';