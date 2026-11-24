import { Card, CardBody } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ApprovalSectionProps {
  approved: boolean;
  approvalPending: boolean;
  runId: string;
  onApprove: (approved: boolean) => void;
  loading: boolean;
}

export const ApprovalSection = ({ approved, approvalPending, runId, onApprove, loading }: ApprovalSectionProps) => {
  if (approved) {
    return (
      <Card className="mb-6 border-green-200">
        <CardBody className="flex items-center gap-3 p-6 bg-green-50">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">Report Approved</p>
            <p className="text-sm text-green-600">The report has been approved and is ready for email delivery.</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!approvalPending) {
    return null;
  }

  return (
    <Card className="mb-6 border-red-200">
      <div className="card-header bg-red-50 border-red-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900">Approval Required</h3>
        </div>
      </div>
      <CardBody className="space-y-4">
        <p className="text-gray-700">
          This report contains policy violations or missing data and requires human approval before it can be sent to finance.
        </p>
        <div className="flex gap-3">
          <Button
            variant="success"
            size="lg"
            onClick={() => onApprove(true)}
            disabled={loading}
            className="flex-1"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Approve & Send
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={() => onApprove(false)}
            disabled={loading}
            className="flex-1"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Reject
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};