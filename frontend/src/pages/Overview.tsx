import { Link } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Bot,
  Brain,
  AlertTriangle as AlertTriangleIcon,
  Shield,
  Sparkles,
  Zap,
  Database,
  BrainCircuit,
  Server,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useExpenseReport } from '../hooks/useExpenseReport';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { KPICard, ActivityItem, AgentStatusCard } from '../components/dashboard';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  loading?: boolean;
}

const StatCard = ({ icon, iconColor, label, value, trend, loading }: StatCardProps) => {
  const Icon = icon;

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <Card className="kpi-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-text-secondary">{label}</p>
          <p className="text-display-sm font-bold text-text-primary mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.value > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-success-500" aria-hidden="true" />
              ) : trend.value < 0 ? (
                <ArrowDownRight className="w-4 h-4 text-danger-500" aria-hidden="true" />
              ) : (
                <Minus className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
              )}
              <span className={`text-body-sm font-medium ${trend.value > 0 ? 'text-success-600' : trend.value < 0 ? 'text-danger-600' : 'text-text-tertiary'}`}>
                {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconColor}`}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
};

const activityIcons = {
  report_generated: { icon: FileText, color: 'bg-primary-100 text-primary-600' },
  expenses_categorized: { icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
  policy_violation: { icon: AlertTriangle, color: 'bg-warning-100 text-warning-600' },
  approval_requested: { icon: Clock, color: 'bg-purple-100 text-purple-600' },
  email_sent: { icon: Send, color: 'bg-green-100 text-green-600' },
  approval_approved: { icon: CheckCircle, color: 'bg-success-100 text-success-600' },
  approval_rejected: { icon: XCircle, color: 'bg-danger-100 text-danger-600' },
};

const mockActivities = [
  { id: 1, type: 'report_generated', title: 'Report generated', description: 'July 2025 expense report created', time: '2 hours ago' },
  { id: 2, type: 'expenses_categorized', title: 'Expenses categorized', description: '11 expenses auto-categorized', time: '3 hours ago' },
  { id: 3, type: 'policy_violation', title: 'Policy violation detected', description: 'Flight expense exceeds limit by ₹150', time: '5 hours ago' },
  { id: 4, type: 'approval_requested', title: 'Approval requested', description: 'Report sent for manager approval', time: '6 hours ago' },
  { id: 5, type: 'email_sent', title: 'Email sent', description: 'Report delivered to finance team', time: '1 day ago' },
  { id: 6, type: 'approval_approved', title: 'Report approved', description: 'June 2025 report approved by manager', time: '2 days ago' },
];

export const Overview = () => {
  const { report, loading, sampleRequests } = useExpenseReport();

  const totalExpenses = report?.summary?.expense_count || 0;
  const totalAmount = report?.summary?.grand_total || 0;
  const reportsGenerated = sampleRequests.length > 0 ? 12 : 0;
  const pendingApprovals = (report?.violations?.length ?? 0) > 0 || (report?.missing_data?.length ?? 0) > 0 ? 1 : 0;
  const policyViolations = report?.violations?.length ?? 0;

  const trends = {
    totalExpenses: { value: 12, label: 'vs last month' },
    totalAmount: { value: 8.5, label: 'vs last month' },
    reportsGenerated: { value: 25, label: 'vs last month' },
    pendingApprovals: { value: -30, label: 'vs last month' },
  };

  const agentConfigs = [
    { id: 'supervisor', name: 'Supervisor Agent', icon: Bot, color: 'bg-purple-100 text-purple-600', description: 'Planning & orchestration', status: 'idle' as const },
    { id: 'expense-intelligence', name: 'Expense Intelligence', icon: Brain, color: 'bg-blue-100 text-blue-600', description: 'Retrieval & categorization', status: 'idle' as const },
    { id: 'exception-handler', name: 'Exception Handler', icon: AlertTriangleIcon, color: 'bg-yellow-100 text-yellow-600', description: 'Missing data detection', status: 'idle' as const },
    { id: 'validation', name: 'Validation Agent', icon: Shield, color: 'bg-green-100 text-green-600', description: 'Policy check & PDF generation', status: 'idle' as const },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout pageTitle="Overview" breadcrumbs={[{ label: 'Overview' }]}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display-md font-bold text-text-primary">{getGreeting()}, Mohit</h1>
            <p className="text-body-lg text-text-secondary mt-1">Manage your travel expenses with autonomous AI-powered reporting.</p>
          </div>
          <Link to="/generate">
            <Button variant="primary" size="lg" className="gap-2">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              Generate New Report
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            iconColor="bg-primary-100 text-primary-600"
            label="Total Expenses"
            value={`₹${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
            trend={trends.totalAmount}
            loading={loading}
          />
          <StatCard
            icon={FileText}
            iconColor="bg-green-100 text-green-600"
            label="Reports Generated"
            value={reportsGenerated}
            trend={trends.reportsGenerated}
            loading={loading}
          />
          <StatCard
            icon={Clock}
            iconColor="bg-purple-100 text-purple-600"
            label="Pending Approvals"
            value={pendingApprovals}
            trend={trends.pendingApprovals}
            loading={loading}
          />
          <StatCard
            icon={AlertTriangle}
            iconColor="bg-warning-100 text-warning-600"
            label="Policy Violations"
            value={policyViolations}
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2" aria-labelledby="recent-activity-heading">
            <Card>
              <CardBody className="p-0">
                <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
                  <h2 id="recent-activity-heading" className="text-heading-md font-semibold text-text-primary">Recent Activity</h2>
                  <Link to="/history" className="text-body-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
                </div>
                <div className="divide-y divide-border-default">
                  {mockActivities.map((activity) => {
                    const config = activityIcons[activity.type as keyof typeof activityIcons] || activityIcons.report_generated;
                    const Icon = config.icon;

                    return (
                      <ActivityItem
                        key={activity.id}
                        icon={<Icon className="w-5 h-5" aria-hidden="true" />}
                        iconBg={config.color}
                        title={activity.title}
                        description={activity.description}
                        time={activity.time}
                      />
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </section>

          <section aria-labelledby="quick-actions-heading">
            <Card>
              <CardBody className="p-0">
                <div className="px-6 py-4 border-b border-border-default">
                  <h2 id="quick-actions-heading" className="text-heading-md font-semibold text-text-primary">Quick Actions</h2>
                </div>
                <div className="space-y-2 p-4">
                  <Link to="/generate" className="block">
                    <Button variant="secondary" className="w-full justify-start gap-3">
                      <div className="p-2 bg-primary-100 rounded-xl"><Sparkles className="w-5 h-5 text-primary-600" /></div>
                      <div className="text-left">
                        <p className="font-medium text-text-primary">Generate Report</p>
                        <p className="text-body-xs text-text-tertiary">Create new expense report</p>
                      </div>
                    </Button>
                  </Link>
                  <Link to="/history" className="block">
                    <Button variant="secondary" className="w-full justify-start gap-3">
                      <div className="p-2 bg-green-100 rounded-xl"><FileText className="w-5 h-5 text-green-600" /></div>
                      <div className="text-left">
                        <p className="font-medium text-text-primary">View History</p>
                        <p className="text-body-xs text-text-tertiary">Browse past reports</p>
                      </div>
                    </Button>
                  </Link>
                  <Link to="/approvals" className="block">
                    <Button variant="secondary" className="w-full justify-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-xl"><Clock className="w-5 h-5 text-purple-600" /></div>
                      <div className="text-left">
                        <p className="font-medium text-text-primary">Approvals</p>
                        <p className="text-body-xs text-text-tertiary">Review pending reports</p>
                      </div>
                    </Button>
                  </Link>
                  <Link to="/transactions" className="block">
                    <Button variant="secondary" className="w-full justify-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
                      <div className="text-left">
                        <p className="font-medium text-text-primary">Transactions</p>
                        <p className="text-body-xs text-text-tertiary">Browse all expenses</p>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </section>
        </div>

        <section aria-labelledby="agent-status-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="agent-status-heading" className="text-heading-lg font-semibold text-text-primary">AI Agent Status</h2>
            <Link to="/monitoring" className="text-body-sm text-primary-600 hover:text-primary-700 font-medium">View details</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentConfigs.map((agent) => (
              <AgentStatusCard
                key={agent.id}
                name={agent.name}
                icon={agent.icon}
                iconBg={agent.color}
                description={agent.description}
                status={agent.status}
                lastRun="Never"
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="system-health-heading" className="mt-6">
          <h2 id="system-health-heading" className="text-heading-lg font-semibold text-text-primary mb-4">System Health</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="kpi-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl"><Database className="w-6 h-6 text-green-600" /></div>
                <div>
                  <p className="text-body-sm text-text-secondary">Database</p>
                  <p className="font-medium text-text-primary">Connected</p>
                </div>
                <Badge variant="success" className="ml-auto">Healthy</Badge>
              </div>
            </Card>
            <Card className="kpi-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl"><BrainCircuit className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <p className="text-body-sm text-text-secondary">AI Service</p>
                  <p className="font-medium text-text-primary">Operational</p>
                </div>
                <Badge variant="success" className="ml-auto">Healthy</Badge>
              </div>
            </Card>
            <Card className="kpi-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl"><Server className="w-6 h-6 text-purple-600" /></div>
                <div>
                  <p className="text-body-sm text-text-secondary">Redis Cache</p>
                  <p className="font-medium text-text-primary">Connected</p>
                </div>
                <Badge variant="success" className="ml-auto">Healthy</Badge>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};