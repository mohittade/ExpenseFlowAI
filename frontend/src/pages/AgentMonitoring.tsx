import { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Bot,
  Brain,
  Shield,
  AlertTriangle as AlertTriangleIcon,
  Terminal,
  RefreshCw,
  TrendingUp,
  Clock,
  Zap,
  BarChart2,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Table, Pagination } from '../components/ui/Table';
import { Tabs, TabPanel } from '../components/ui/Tabs';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { useExpenseReport } from '../hooks/useExpenseReport';
import { WORKFLOW_STEPS, STEP_LABELS, type WorkflowStep } from '../types';
import { format, parseISO } from 'date-fns';

const agentConfigs = [
  {
    id: 'supervisor',
    name: 'Supervisor Agent',
    icon: Bot,
    color: 'bg-purple-100 text-purple-600',
    description: 'Planning, orchestration, and approval coordination',
    responsibilities: ['Request parsing', 'Workflow planning', 'Agent coordination', 'Approval management', 'Email delivery'],
  },
  {
    id: 'expense-intelligence',
    name: 'Expense Intelligence',
    icon: Brain,
    color: 'bg-blue-100 text-blue-600',
    description: 'Expense retrieval, categorization, and analysis',
    responsibilities: ['Expense retrieval', 'Smart categorization', 'Amount validation', 'Receipt matching', 'Duplicate detection'],
  },
  {
    id: 'exception-handler',
    name: 'Exception Handler',
    icon: AlertTriangleIcon,
    color: 'bg-yellow-100 text-yellow-600',
    description: 'Missing data detection and exception management',
    responsibilities: ['Missing field detection', 'Category inference', 'Data quality checks', 'Exception escalation', 'Human review triggers'],
  },
  {
    id: 'validation',
    name: 'Validation Agent',
    icon: Shield,
    color: 'bg-green-100 text-green-600',
    description: 'Policy validation, totals calculation, and PDF generation',
    responsibilities: ['Policy compliance', 'Limit enforcement', 'Totals calculation', 'PDF generation', 'Report validation'],
  },
];

const mockExecutions = [
  { id: 'exec_1', agent: 'supervisor', action: 'plan', status: 'completed', duration: '1.2s', timestamp: '2026-11-23T11:40:10', details: 'Planned 9-step workflow for July 2025 report' },
  { id: 'exec_2', agent: 'expense-intelligence', action: 'retrieve_expenses', status: 'completed', duration: '0.8s', timestamp: '2026-11-23T11:40:10', details: 'Retrieved 11 expenses for date range: July 2025' },
  { id: 'exec_3', agent: 'expense-intelligence', action: 'categorize', status: 'completed', duration: '0.5s', timestamp: '2026-11-23T11:40:11', details: 'Categorized 3 uncategorized expenses' },
  { id: 'exec_4', agent: 'exception-handler', action: 'check_missing', status: 'completed', duration: '0.3s', timestamp: '2026-11-23T11:40:11', details: 'Found 13 issues, human_required: true' },
  { id: 'exec_5', agent: 'validation', action: 'check_policy', status: 'completed', duration: '0.4s', timestamp: '2026-11-23T11:40:11', details: 'Found 2 policy violations' },
  { id: 'exec_6', agent: 'validation', action: 'calculate_totals', status: 'completed', duration: '0.2s', timestamp: '2026-11-23T11:40:11', details: 'Grand total: 1801.49' },
  { id: 'exec_7', agent: 'validation', action: 'generate_pdf', status: 'completed', duration: '1.5s', timestamp: '2026-11-23T11:40:11', details: 'Report saved to expense_report_c0d3b8d9.pdf' },
  { id: 'exec_8', agent: 'validation', action: 'validate_report', status: 'completed', duration: '0.1s', timestamp: '2026-11-23T11:40:11', details: 'Valid: true' },
  { id: 'exec_9', agent: 'supervisor', action: 'request_approval', status: 'completed', duration: '0.1s', timestamp: '2026-11-23T11:40:11', details: 'Approval requested due to violations' },
  { id: 'exec_10', agent: 'supervisor', action: 'send_email', status: 'failed', duration: '2.3s', timestamp: '2026-11-23T11:40:13', details: 'SMTP authentication failed' },
  { id: 'exec_11', agent: 'supervisor', action: 'plan', status: 'completed', duration: '1.1s', timestamp: '2026-11-23T11:41:08', details: 'Planned 9-step workflow for July 2025 report' },
  { id: 'exec_12', agent: 'expense-intelligence', action: 'retrieve_expenses', status: 'completed', duration: '0.7s', timestamp: '2026-11-23T11:41:08', details: 'Retrieved 11 expenses for date range: July 2025' },
  { id: 'exec_13', agent: 'validation', action: 'generate_pdf', status: 'completed', duration: '1.4s', timestamp: '2026-11-23T11:41:08', details: 'Report saved to expense_report_4245cd38.pdf' },
  { id: 'exec_14', agent: 'supervisor', action: 'send_email', status: 'failed', duration: '2.1s', timestamp: '2026-11-23T11:41:10', details: 'SMTP authentication failed' },
];

const statusConfig = {
  completed: { label: 'Completed', color: 'success', icon: CheckCircle },
  failed: { label: 'Failed', color: 'danger', icon: XCircle },
  running: { label: 'Running', color: 'info', icon: Loader2 },
};

const agentStatusConfig = {
  idle: { label: 'Idle', color: 'neutral', dot: 'bg-neutral-400' },
  running: { label: 'Running', color: 'info', dot: 'bg-primary-500 animate-pulse' },
  completed: { label: 'Completed', color: 'success', dot: 'bg-success-500' },
  failed: { label: 'Failed', color: 'danger', dot: 'bg-danger-500' },
};

export const AgentMonitoring = () => {
  const { logs, logsLoading, fetchLogs } = useExpenseReport();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [executions, setExecutions] = useState(mockExecutions);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'supervisor', label: 'Supervisor', icon: <Bot className="w-4 h-4" /> },
    { id: 'expense-intelligence', label: 'Expense Intelligence', icon: <Brain className="w-4 h-4" /> },
    { id: 'exception-handler', label: 'Exception Handler', icon: <AlertTriangleIcon className="w-4 h-4" /> },
    { id: 'validation', label: 'Validation', icon: <Shield className="w-4 h-4" /> },
    { id: 'executions', label: 'Executions', icon: <Terminal className="w-4 h-4" /> },
  ];

  const filteredExecutions = useMemo(() => {
    if (!selectedAgent || selectedAgent === 'all') return executions;
    return executions.filter((e) => e.agent === selectedAgent);
  }, [executions, selectedAgent]);

  const paginatedExecutions = filteredExecutions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredExecutions.length / itemsPerPage);

  const stats = {
    totalAgents: agentConfigs.length,
    activeAgents: 1,
    completedExecutions: executions.filter((e) => e.status === 'completed').length,
    failedExecutions: executions.filter((e) => e.status === 'failed').length,
    avgDuration: '0.8s',
    successRate: '90%',
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // In real app, fetch from API
    }, 1000);
  };

  return (
    <DashboardLayout
      pageTitle="Agent Monitoring"
      breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Agent Monitoring' }]}
      activeAgent={selectedAgent ?? undefined}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display-sm font-bold text-text-primary">Agent Monitoring</h1>
            <p className="text-text-secondary mt-1">Monitor AI agent performance and execution status</p>
          </div>
          <Button variant="secondary" onClick={handleRefresh} loading={loading} className="gap-2">
            <RefreshCw className="w-5 h-5" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Total Agents</p>
                <p className="text-display-sm font-bold text-text-primary">{stats.totalAgents}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Active Agents</p>
                <p className="text-display-sm font-bold text-text-primary">{stats.activeAgents}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Completed</p>
                <p className="text-display-sm font-bold text-text-primary">{stats.completedExecutions}</p>
              </div>
              <div className="p-3 bg-success-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Failed</p>
                <p className="text-display-sm font-bold text-text-primary">{stats.failedExecutions}</p>
              </div>
              <div className="p-3 bg-danger-100 rounded-xl">
                <XCircle className="w-6 h-6 text-danger-600" />
              </div>
            </div>
          </Card>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section aria-labelledby="agent-cards-heading">
              <h2 id="agent-cards-heading" className="text-heading-lg font-semibold text-text-primary mb-4">Agent Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {agentConfigs.map((agent) => (
                  <Card key={agent.id} className="kpi-card" hover>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${agent.color} flex-shrink-0`}>
                        <agent.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                          <Badge variant="info" size="sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse mr-1.5" />
                            Idle
                          </Badge>
                        </div>
                        <p className="text-body-sm text-text-secondary mt-1">{agent.description}</p>
                        <div className="mt-3 flex items-center gap-4 text-body-xs text-text-tertiary">
                          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 95% success</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 0.8s avg</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            <section aria-labelledby="workflow-stats-heading">
              <h2 id="workflow-stats-heading" className="text-heading-lg font-semibold text-text-primary mb-4">Workflow Statistics</h2>
              <Card>
                <CardBody className="space-y-4">
                  {WORKFLOW_STEPS.map((step) => {
                    const stepExecutions = executions.filter((e) => {
                      const stepMapping: Record<string, string> = {
                        parse_request: 'plan',
                        retrieve_expenses: 'retrieve_expenses',
                        categorize_expenses: 'categorize',
                        check_missing_data: 'check_missing',
                        validate_policies: 'check_policy',
                        calculate_totals: 'calculate_totals',
                        generate_pdf: 'generate_pdf',
                        validate_report: 'validate_report',
                        request_approval: 'request_approval',
                        send_email: 'send_email',
                      };
                      return e.action === stepMapping[step];
                    });

                    const completed = stepExecutions.filter((e) => e.status === 'completed').length;
                    const failed = stepExecutions.filter((e) => e.status === 'failed').length;
                    const total = stepExecutions.length;
                    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <div key={step} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                              <Zap className="w-4 h-4" />
                            </span>
                            <span className="font-medium text-text-primary">{STEP_LABELS[step]}</span>
                          </div>
                          <Badge variant={successRate === 100 ? 'success' : successRate > 0 ? 'warning' : 'danger'} size="sm">
                            {successRate}% success
                          </Badge>
                        </div>
                        <Progress value={successRate} max={100} className="h-1.5" />
                        <div className="flex justify-between text-body-xs text-text-tertiary">
                          <span>{completed}/{total} executions</span>
                          <span>{failed} failed</span>
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            </section>
          </div>
        )}

        {(() => {
          const agent = agentConfigs.find((a) => a.id === activeTab);
          if (!agent) return null;

          return (
            <section aria-labelledby="agent-detail-heading">
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${agent.color} flex-shrink-0`}>
                      <agent.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 id="agent-detail-heading" className="text-heading-lg font-semibold text-text-primary">{agent.name}</h2>
                      <p className="text-text-secondary mt-1">{agent.description}</p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="info" size="md">Idle</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <h3 className="text-heading-sm font-semibold text-text-primary mb-3">Responsibilities</h3>
                  <ul className="space-y-2">
                    {agent.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl">
                        <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
                        <span className="text-body-md text-text-primary">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </div>
            </section>
          )
        })()}

        {activeTab === 'executions' && (
          <section aria-labelledby="executions-heading">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 id="executions-heading" className="text-heading-lg font-semibold text-text-primary">Execution History</h2>
              <div className="flex items-center gap-3">
                <select
                  value={selectedAgent || 'all'}
                  onChange={(e) => setSelectedAgent(e.target.value === 'all' ? null : e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="all">All Agents</option>
                  {agentConfigs.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <Button variant="secondary" onClick={handleRefresh} loading={loading} size="sm" className="gap-1.5">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <Card>
              <CardBody className="p-0">
                <Table
                  columns={[
                    { key: 'timestamp', header: 'Time', render: (e: any) => <span className="font-mono text-body-sm">{format(parseISO(e.timestamp), 'HH:mm:ss')}</span> },
                    { key: 'agent', header: 'Agent', render: (e: any) => {
                      const agent = agentConfigs.find((a) => a.id === e.agent);
                      return (
                        <div className="flex items-center gap-2">
                          {agent && <span className={`w-2 h-2 rounded-full ${agent.color.replace('bg-', 'bg-').replace('text-', '')} flex-shrink-0`} />}
                          <span className="text-body-sm capitalize">{e.agent.replace('-', ' ')}</span>
                        </div>
                      );
                    }},
                    { key: 'action', header: 'Action', render: (e: any) => <span className="text-body-sm text-text-primary capitalize">{e.action.replace('_', ' ')}</span> },
                    { key: 'status', header: 'Status', align: 'center' as const, render: (e: any) => {
                      const config = statusConfig[e.status as keyof typeof statusConfig];
                      const Icon = config.icon;
                      return (
                        <Badge variant={config.color as any} className="gap-1">
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      );
                    }},
                    { key: 'duration', header: 'Duration', align: 'center' as const, render: (e: any) => <span className="font-mono text-body-sm text-text-secondary">{e.duration}</span> },
                    { key: 'details', header: 'Details', render: (e: any) => <span className="text-body-sm text-text-tertiary max-w-xs truncate block">{e.details}</span> },
                  ]}
                  data={paginatedExecutions}
                  keyExtractor={(e) => e.id}
                  hoverable
                  striped
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredExecutions.length}
                  itemsPerPage={itemsPerPage}
                />
              </CardBody>
            </Card>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

import { useMemo } from 'react';