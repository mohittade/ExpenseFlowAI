import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  History,
  UserCheck,
  CreditCard,
  Bot,
  Brain,
  AlertTriangle,
  Shield,
  Activity,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles,
  Zap,
  Database,
  Tag,
  Calculator,
  FileText as FileTextIcon,
  UserCheck as UserCheckIcon,
  Send,
  Search,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Card, CardBody } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/' },
  { id: 'generate', label: 'Generate Report', icon: FileText, href: '/generate' },
  { id: 'history', label: 'Reports History', icon: History, href: '/history' },
  { id: 'approvals', label: 'Approvals', icon: UserCheck, href: '/approvals' },
  { id: 'transactions', label: 'Transactions', icon: CreditCard, href: '/transactions' },
];

const agents = [
  {
    id: 'supervisor',
    name: 'Supervisor Agent',
    icon: Bot,
    color: 'bg-purple-100 text-purple-600',
    description: 'Planning & orchestration',
    status: 'idle' as const,
  },
  {
    id: 'expense-intelligence',
    name: 'Expense Intelligence',
    icon: Brain,
    color: 'bg-blue-100 text-blue-600',
    description: 'Retrieval & categorization',
    status: 'idle' as const,
  },
  {
    id: 'exception-handler',
    name: 'Exception Handler',
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-600',
    description: 'Missing data detection',
    status: 'idle' as const,
  },
  {
    id: 'validation',
    name: 'Validation Agent',
    icon: Shield,
    color: 'bg-green-100 text-green-600',
    description: 'Policy check & PDF generation',
    status: 'idle' as const,
  },
];

const workflowSteps = [
  { id: 'parse_request', name: 'Parse Request', icon: Search },
  { id: 'retrieve_expenses', name: 'Retrieve Expenses', icon: Database },
  { id: 'categorize_expenses', name: 'Categorize Expenses', icon: Tag },
  { id: 'check_missing_data', name: 'Check Missing Data', icon: AlertTriangle },
  { id: 'validate_policies', name: 'Validate Policies', icon: Shield },
  { id: 'calculate_totals', name: 'Calculate Totals', icon: Calculator },
  { id: 'generate_pdf', name: 'Generate PDF', icon: FileTextIcon },
  { id: 'validate_report', name: 'Validate Report', icon: CheckCircle },
  { id: 'request_approval', name: 'Request Approval', icon: UserCheckIcon },
  { id: 'send_email', name: 'Send Email', icon: Send },
];

const systemItems = [
  { id: 'monitoring', label: 'Agent Monitoring', icon: Activity, href: '/monitoring' },
  { id: 'logs', label: 'Execution Logs', icon: Terminal, href: '/logs' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

interface AgentStatusProps {
  status: AgentStatus;
  className?: string;
}

const AgentStatusIndicator = ({ status, className = '' }: AgentStatusProps) => {
  const statusConfig = {
    idle: { color: 'bg-neutral-400', label: 'Idle' },
    running: { color: 'bg-primary-500 animate-pulse', label: 'Running' },
    completed: { color: 'bg-success-500', label: 'Completed' },
    failed: { color: 'bg-danger-500', label: 'Failed' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-body-xs ${className}`}>
      <span className={`w-2 h-2 rounded-full ${config.color}`} aria-hidden="true" />
      <span className="text-text-secondary">{config.label}</span>
    </span>
  );
};

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  activeAgent?: string;
  agentStatuses?: Record<string, AgentStatus>;
  currentWorkflowStep?: string;
}

export const Sidebar = ({
  collapsed = false,
  onToggle,
  activeAgent,
  agentStatuses = {},
  currentWorkflowStep,
}: SidebarProps) => {
  const [hovered, setHovered] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => location.pathname === href;

  const getStepStatus = (stepId: string) => {
    if (!currentWorkflowStep) return 'pending';
    const currentIndex = workflowSteps.findIndex((s) => s.id === currentWorkflowStep);
    const stepIndex = workflowSteps.findIndex((s) => s.id === stepId);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const renderIcon = (Icon: React.ComponentType<{ className?: string }>, colorClass: string, size = 'w-5 h-5') => (
    <Icon className={`${size} ${colorClass}`} aria-hidden="true" />
  );

  if (collapsed) {
    return (
      <aside
        className="w-16 bg-surface border-r border-border-default flex flex-col transition-all duration-300"
        aria-label="Sidebar navigation (collapsed)"
      >
        <div className="flex items-center justify-between h-16 px-3 border-b border-border-default">
          <Link to="/" className="flex items-center justify-center" aria-label="ExpenseFlow AI Home">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Sparkles className="w-6 h-6 text-primary-600" aria-hidden="true" />
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-text-tertiary hover:text-text-primary"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={`flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-150
                ${isActive(item.href)
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-text-tertiary hover:bg-surface-hover hover:text-text-primary'}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
              title={item.label}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-border-default">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full text-text-tertiary hover:text-text-primary"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-72 bg-surface border-r border-border-default flex flex-col transition-all duration-300"
      aria-label="Sidebar navigation"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border-default">
        <Link to="/" className="flex items-center gap-3" aria-label="ExpenseFlow AI Home">
          <div className="p-2 bg-primary-100 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-heading-sm font-bold text-text-primary truncate">ExpenseFlow AI</h1>
            <p className="text-caption text-text-tertiary truncate">Autonomous Expense Reporting</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-text-tertiary hover:text-text-primary lg:hidden"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </Button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <section aria-labelledby="nav-heading">
          <h2 id="nav-heading" className="text-caption font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-2">
            Navigation
          </h2>
          <ul className="space-y-1" role="list">
            {navigation.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                    ${isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="agents-heading">
          <h2 id="agents-heading" className="text-caption font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-2">
            AI Agents
          </h2>
          <div className="space-y-2">
            {agents.map((agent) => {
              const status = agentStatuses[agent.id] || 'idle';
              const isActiveAgent = activeAgent === agent.id;

              return (
                <div
                  key={agent.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-150
                    ${isActiveAgent ? 'bg-primary-50 border border-primary-200' : 'bg-surface-hover hover:bg-neutral-100'}
                    ${status === 'running' ? 'ring-2 ring-primary-500/20' : ''}`}
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 ${agent.color}`}>
                    <agent.icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary truncate">{agent.name}</p>
                      {isActiveAgent && (
                        <Badge variant="info" size="sm">Active</Badge>
                      )}
                    </div>
                    <p className="text-body-xs text-text-tertiary mt-0.5">{agent.description}</p>
                    <AgentStatusIndicator status={status} className="mt-2" />
                  </div>
                  {status === 'running' && (
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="workflow-heading">
          <h2 id="workflow-heading" className="text-caption font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-2">
            Workflow Steps
          </h2>
          <div className="space-y-1.5">
            {workflowSteps.map((step) => {
              const stepStatus = getStepStatus(step.id);

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors duration-150
                    ${stepStatus === 'current' ? 'bg-primary-50' : 'hover:bg-surface-hover'}`}
                >
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full border-2 flex-shrink-0 transition-all duration-300
                      ${stepStatus === 'completed'
                        ? 'bg-success-500 border-success-500 text-white'
                        : stepStatus === 'current'
                        ? 'bg-primary-500 border-primary-500 text-white animate-pulse'
                        : 'bg-surface border-border-default text-text-tertiary'}`}
                  >
                    {stepStatus === 'completed' ? (
                      <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    ) : stepStatus === 'current' ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <step.icon className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <span className={`text-body-sm truncate font-medium
                    ${stepStatus === 'completed' ? 'text-success-600'
                    : stepStatus === 'current' ? 'text-primary-600'
                    : 'text-text-secondary'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="system-heading">
          <h2 id="system-heading" className="text-caption font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-2">
            System
          </h2>
          <ul className="space-y-1" role="list">
            {systemItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                    ${isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </nav>

      <div className="p-4 border-t border-border-default">
        <div className="flex items-center gap-3">
          <Avatar
            name={user?.full_name || user?.username || 'User'}
            size="sm"
            status="online"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-primary truncate">
              {user?.full_name || user?.username || 'User'}
            </p>
            <p className="text-caption text-text-tertiary truncate">
              {user?.email || 'user@company.com'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};