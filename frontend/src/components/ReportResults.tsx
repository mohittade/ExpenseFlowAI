import { ExpenseResponse } from '../types';
import { Button } from './ui/Button';
import { Card, CardBody } from './ui/Card';
import { ProgressStepper } from './ProgressStepper';
import { ExpenseSummary } from './ExpenseSummary';
import { CategoryBreakdown } from './CategoryBreakdown';
import { ExpenseTable } from './ExpenseTable';
import { ViolationsPanel } from './ViolationsPanel';
import { MissingDataPanel } from './MissingDataPanel';
import { ApprovalSection } from './ApprovalSection';
import { PDFDownload } from './PDFDownload';
import { EmailStatus } from './EmailStatus';
import { ExecutionLogs } from './ExecutionLogs';
import { RotateCcw, Loader2 } from 'lucide-react';

interface ReportResultsProps {
  report: ExpenseResponse;
  onNewRequest: () => void;
  onApprove: (approved: boolean) => void;
  onRefreshLogs: () => void;
  logsLoading: boolean;
  logs: import('../types').ExecutionLog[];
}

export const ReportResults = ({
  report,
  onNewRequest,
  onApprove,
  onRefreshLogs,
  logsLoading,
  logs,
}: ReportResultsProps) => {
  const approvalPending = !report.approved && (report.violations.length > 0 || report.missing_data.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Results</h2>
          <p className="text-gray-500">Run ID: {report.run_id} • Step: {report.current_step.replace('_', ' ')}</p>
        </div>
        <Button variant="secondary" onClick={onNewRequest} size="lg">
          <RotateCcw className="w-5 h-5 mr-2" />
          New Request
        </Button>
      </div>

      <Card className="mb-6">
        <CardBody className="p-6">
          <ProgressStepper
            currentStep={report.current_step}
            completed={report.current_step === 'send_email'}
            error={!!report.error}
          />
        </CardBody>
      </Card>

      <ExpenseSummary summary={report.summary} />
      <CategoryBreakdown summary={report.summary} />
      <ExpenseTable
        expenses={report.expenses}
        violations={report.violations}
        missingData={report.missing_data}
      />
      <ViolationsPanel violations={report.violations} approvalPending={approvalPending} />
      <MissingDataPanel missingData={report.missing_data} approvalPending={approvalPending} />
      <ApprovalSection
        approved={report.approved}
        approvalPending={approvalPending}
        runId={report.run_id}
        onApprove={onApprove}
        loading={logsLoading}
      />
      <PDFDownload pdfPath={report.pdf_path} runId={report.run_id} />
      <EmailStatus emailResult={report.email_result} />
      <ExecutionLogs
        logs={logs}
        runId={report.run_id}
        loading={logsLoading}
        onRefresh={onRefreshLogs}
      />

      {report.error && (
        <Card className="mb-6 border-red-200">
          <CardBody className="p-6 bg-red-50">
            <div className="flex items-start gap-3">
              <Loader2 className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Workflow Error</p>
                <p className="text-sm text-red-600 mt-1">{report.error}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};