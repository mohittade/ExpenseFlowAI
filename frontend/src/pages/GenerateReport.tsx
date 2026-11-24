import { useState, FormEvent, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Sparkles,
  Loader2,
  User,
  Calendar,
  Mail,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Database,
  Tag,
  Shield,
  Calculator,
  RotateCcw,
  Bot,
  Brain,
  AlertTriangle as AlertTriangleIcon,
  Shield as ShieldIcon,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { useExpenseReport } from '../hooks/useExpenseReport';
import { WORKFLOW_STEPS, STEP_LABELS, type WorkflowStep } from '../types';
import toast from 'react-hot-toast';
import { getReports } from '../api/client';

const Search = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// Map workflow steps to agent IDs
const stepToAgent: Record<string, string> = {
  parse_request: 'supervisor',
  retrieve_expenses: 'expense-intelligence',
  categorize_expenses: 'expense-intelligence',
  check_missing_data: 'exception-handler',
  validate_policies: 'validation',
  calculate_totals: 'validation',
  generate_pdf: 'validation',
  validate_report: 'validation',
  request_approval: 'supervisor',
  send_email: 'supervisor',
};

function getAgentStatuses(currentStep: string, completed: boolean, error: boolean): Record<string, 'idle' | 'running' | 'completed' | 'failed'> {
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStep as any);
  const statuses: Record<string, 'idle' | 'running' | 'completed' | 'failed'> = {
    'supervisor': 'idle',
    'expense-intelligence': 'idle',
    'exception-handler': 'idle',
    'validation': 'idle',
  };

  if (completed && !error) {
    return { 'supervisor': 'completed', 'expense-intelligence': 'completed', 'exception-handler': 'completed', 'validation': 'completed' };
  }

  if (currentIndex >= 0) {
    const currentAgent = stepToAgent[currentStep];
    if (currentAgent) {
      statuses[currentAgent] = 'running';
    }
    // Mark previous agents as completed
    for (let i = 0; i < currentIndex; i++) {
      const agent = stepToAgent[WORKFLOW_STEPS[i]];
      if (agent) statuses[agent] = 'completed';
    }
  }

  if (error && currentIndex >= 0) {
    const currentAgent = stepToAgent[currentStep];
    if (currentAgent) statuses[currentAgent] = 'failed';
  }

  return statuses;
}

const stepIcons: Record<WorkflowStep, React.ComponentType<{ className?: string }>> = {
  parse_request: Search,
  retrieve_expenses: Database,
  categorize_expenses: Tag,
  check_missing_data: AlertTriangle,
  validate_policies: Shield,
  calculate_totals: Calculator,
  generate_pdf: FileText,
  validate_report: CheckCircle,
  request_approval: UserCheck,
  send_email: Send,
  error: XCircle,
};

interface WorkflowVisualizationProps {
  currentStep: string;
  completed: boolean;
  error?: boolean;
  runId?: string;
  onRefresh?: () => void;
}

const WorkflowVisualization = ({ currentStep, completed, error, runId, onRefresh }: WorkflowVisualizationProps) => {
  const [expanded, setExpanded] = useState(false);

  const currentIndex = WORKFLOW_STEPS.indexOf(currentStep as WorkflowStep);

  return (
    <Card className="mb-6">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-xl">
            <Sparkles className="w-5 h-5 text-primary-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-heading-md font-semibold text-text-primary">Agent Workflow Execution</h3>
            <p className="text-body-sm text-text-secondary">Real-time multi-agent orchestration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {runId && (
            <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-1.5">
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Refresh
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1.5"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardBody className={expanded ? 'p-6' : 'p-6 pb-2'}>
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center min-w-max">
            {WORKFLOW_STEPS.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;
              const isError = error && isCurrent;
              const StepIcon = stepIcons[step];

              return (
                <div key={step} className="flex flex-col items-center relative">
                  <div className="flex items-center">
                    <div
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-success-500 border-success-500 text-white'
                          : isCurrent
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : isError
                          ? 'bg-danger-500 border-danger-500 text-white'
                          : 'bg-surface border-border-default text-text-tertiary'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" aria-hidden="true" />
                      ) : isCurrent ? (
                        <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                      ) : isError ? (
                        <XCircle className="w-6 h-6" aria-hidden="true" />
                      ) : (
                        <StepIcon className="w-6 h-6" aria-hidden="true" />
                      )}
                    </div>
                    {index < WORKFLOW_STEPS.length - 1 && (
                      <div
                        className={`w-20 h-1 mx-2 transition-colors duration-300 ${
                          isCompleted ? 'bg-success-500' : 'bg-border-default'
                        }`}
                      />
                    )}
                  </div>
                  <p className={`mt-2 text-body-xs text-center w-32 truncate ${
                    isCompleted ? 'text-success-600 font-medium' : isCurrent ? 'text-primary-600 font-medium' : isError ? 'text-danger-600 font-medium' : 'text-text-tertiary'
                  }`}>
                    {STEP_LABELS[step]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {expanded && runId && (
          <div className="pt-4 border-t border-border-default">
            <h4 className="text-body-sm font-medium text-text-secondary mb-3">Execution Details</h4>
            <div className="space-y-2">
              {WORKFLOW_STEPS.slice(0, currentIndex + 1).map((step, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isError = error && isCurrent;
                const StepIcon = stepIcons[step];

                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isCompleted ? 'bg-success-50' : isCurrent ? 'bg-primary-50' : isError ? 'bg-danger-50' : 'bg-surface-hover'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                        isCompleted ? 'bg-success-500 border-success-500 text-white' :
                        isCurrent ? 'bg-primary-500 border-primary-500 text-white' :
                        isError ? 'bg-danger-500 border-danger-500 text-white' :
                        'bg-surface border-border-default text-text-tertiary'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : isError ? <XCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-body-sm ${isCompleted ? 'text-success-700' : isCurrent ? 'text-primary-700' : isError ? 'text-danger-700' : 'text-text-secondary'}`}>
                        {STEP_LABELS[step]}
                      </p>
                      <p className="text-body-xs text-text-tertiary">
                        {isCompleted ? 'Completed' : isCurrent ? 'In progress...' : isError ? 'Failed' : 'Pending'}
                      </p>
                    </div>
                    {isCurrent && (
                      <Progress value={50} max={100} className="w-32" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

const sampleRequests = [
  'Generate my travel expense report for July 2025 and email it to finance.',
  'Create expense report for last month.',
  'Generate travel expense report for August 2025.',
  'Create my expense report for July 2025.',
];

const dateRangeOptions = [
  { value: 'current_month', label: 'Current Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'custom', label: 'Custom Range' },
];

export const GenerateReport = () => {
  const navigate = useNavigate();
  const {
    submitRequest,
    loading,
    error,
    sampleRequests: fetchedSamples,
    reset,
  } = useExpenseReport();

  const [formData, setFormData] = useState({
    user_request: '',
    employee_id: 1,
    employee_name: 'Mohit Tade',
    date_range: 'last_month',
    email_notification: true,
    human_approval: true,
  });

  const [submitted, setSubmitted] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('parse_request');
  const [completed, setCompleted] = useState(false);
  const [workflowError, setWorkflowError] = useState(false);
  const agentStatuses = useMemo(
    () => getAgentStatuses(currentStep, completed, workflowError),
    [currentStep, completed, workflowError]
  );

  const samples = fetchedSamples.length > 0 ? fetchedSamples : sampleRequests;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.user_request.trim()) return;

    setSubmitted(true);
    setCompleted(false);
    setWorkflowError(false);
    setCurrentStep('parse_request');

    try {
      const result = await submitRequest({
        user_request: formData.user_request,
        employee_id: formData.employee_id,
        employee_name: formData.employee_name,
      });

      if (result) {
        setRunId(result.run_id);
        setCurrentStep(result.current_step);
        setCompleted(result.current_step === 'send_email' || result.current_step === 'request_approval');
        setWorkflowError(!!result.error);

        if (result.current_step !== 'send_email') {
          pollWorkflow(result.run_id);
        }

        toast.success('Report generation started!');
      }
    } catch (err) {
      toast.error(error || 'Failed to generate report');
      setSubmitted(false);
    }
  };

  const pollWorkflow = async (runId: string) => {
    const maxAttempts = 90;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) return;

      try {
        attempts++;
        try {
          const reportResult = await getReports(100, 0);
          if (reportResult.reports.some((report) => report.run_id === runId)) {
            setCompleted(true);
            setCurrentStep('request_approval');
            return;
          }
        } catch {
          // Retry if the report list is temporarily unavailable.
        }
        setTimeout(poll, 2000);
      } catch (err) {
        console.error('Polling failed:', err);
      }
    };

    poll();
  };

  const handleSampleClick = (sample: string) => {
    setFormData(prev => ({ ...prev, user_request: sample }));
  };

  const handleNewRequest = () => {
    reset();
    setSubmitted(false);
    setRunId(null);
    setCurrentStep('parse_request');
    setCompleted(false);
    setWorkflowError(false);
  };

  if (submitted && runId) {
    return (
      <DashboardLayout
        pageTitle="Generate Report"
        breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Generate Report' }]}
        currentWorkflowStep={currentStep}
        agentStatuses={agentStatuses}
      >
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-display-sm font-bold text-text-primary">
                {workflowError ? 'Report Not Generated' : completed ? 'Report Ready' : 'Generating Report'}
              </h1>
              <p className="text-text-secondary mt-1">
                {workflowError
                  ? 'The report could not be generated.'
                  : completed
                    ? 'Your report is ready for review.'
                    : STEP_LABELS[currentStep as WorkflowStep] || 'Preparing report'}
              </p>
            </div>
            <Button variant="secondary" onClick={handleNewRequest} className="gap-2 flex-shrink-0">
              <RotateCcw className="w-4 h-4" />
              New
            </Button>
          </div>

          {completed && !workflowError && (
            <Card>
              <CardBody className="flex items-center gap-4 p-5">
                <div className="p-2.5 bg-success-100 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">Generated successfully</p>
                  <p className="text-body-sm text-text-tertiary mt-0.5">Run ID: {runId}</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/history')}>
                  View Report
                </Button>
              </CardBody>
            </Card>
          )}

          {workflowError && (
            <Card>
              <CardBody className="flex items-start gap-4 p-5">
                <div className="p-2.5 bg-danger-100 rounded-xl flex-shrink-0">
                  <XCircle className="w-5 h-5 text-danger-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">Generation failed</p>
                  <p className="text-body-sm text-text-tertiary mt-0.5">Please try again.</p>
                </div>
                <Button variant="secondary" onClick={handleNewRequest}>
                  Try Again
                </Button>
              </CardBody>
            </Card>
          )}

          {!completed && !workflowError && (
            <Card>
              <CardBody className="p-5">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  <div>
                    <p className="font-medium text-text-primary">{STEP_LABELS[currentStep as WorkflowStep] || 'Preparing report'}</p>
                    <p className="text-body-sm text-text-tertiary mt-0.5">Please keep this page open.</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Generate Report"
      breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Generate Report' }]}
      agentStatuses={{ 'supervisor': 'idle', 'expense-intelligence': 'idle', 'exception-handler': 'idle', 'validation': 'idle' }}
    >
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
        <div>
          <h1 className="text-display-sm font-bold text-text-primary">Generate Report</h1>
          <p className="text-text-secondary mt-1">Describe the report you need.</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Textarea
                label="Report Request"
                value={formData.user_request}
                onChange={(e) => setFormData(prev => ({ ...prev, user_request: e.target.value }))}
                placeholder="Generate my travel expense report for July 2025 and email it to HR"
                rows={4}
                helperText="Include the expense type, period, and recipient."
                disabled={loading}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <Input
                  label="Employee ID"
                  type="number"
                  value={formData.employee_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_id: parseInt(e.target.value) || 1 }))}
                  min={1}
                  disabled={loading}
                />
                <Input
                  label="Employee Name"
                  value={formData.employee_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_name: e.target.value }))}
                  placeholder="Mohit Tade"
                  disabled={loading}
                />
              </div>

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full gap-2" disabled={!formData.user_request.trim() || loading}>
                <Send className="w-5 h-5" />
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </form>

            {samples.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border-default">
                <p className="text-body-sm font-medium text-text-secondary mb-3">Quick Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {samples.map((sample, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSampleClick(sample)}
                      disabled={loading}
                      className="px-3 py-1.5 text-body-sm text-text-secondary bg-surface-hover border border-border-default rounded-xl hover:bg-surface-active hover:border-border-strong hover:text-text-primary transition-colors disabled:opacity-50"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="bg-primary-50 border-primary-200">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 rounded-xl flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-primary-900">How it works</h3>
                <ul className="mt-3 space-y-2 text-body-sm text-primary-700">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" /> AI parses your natural language request</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" /> Retrieves relevant expenses from database</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" /> Categorizes and validates each expense</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" /> Checks for policy violations and missing data</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" /> Generates PDF report and requests approval if needed</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" /> Emails final report to finance team</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
};