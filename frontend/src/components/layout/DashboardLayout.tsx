import { useState, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useAuth } from '../../hooks/useAuth';

interface DashboardLayoutProps {
  pageTitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  sidebarCollapsed?: boolean;
  activeAgent?: string;
  agentStatuses?: Record<string, 'idle' | 'running' | 'completed' | 'failed'>;
  currentWorkflowStep?: string;
  children?: ReactNode;
}

export const DashboardLayout = ({
  pageTitle = 'ExpenseFlow AI',
  breadcrumbs,
  sidebarCollapsed = false,
  activeAgent,
  agentStatuses,
  currentWorkflowStep,
  children,
}: DashboardLayoutProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" aria-label="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Outlet />;
  }

  const handleSidebarToggle = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        activeAgent={activeAgent}
        agentStatuses={agentStatuses}
        currentWorkflowStep={currentWorkflowStep}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <TopNav
          onSidebarToggle={handleSidebarToggle}
          sidebarCollapsed={sidebarCollapsed}
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-full mx-auto">
            {children}
            <Outlet />
          </div>
        </main>

        <footer className="bg-surface border-t border-border-default py-4 px-6">
          <p className="text-center text-body-sm text-text-tertiary">
            ExpenseFlow AI - Multi-Agent Autonomous Expense Reporting
          </p>
        </footer>
      </div>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-overlay bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};