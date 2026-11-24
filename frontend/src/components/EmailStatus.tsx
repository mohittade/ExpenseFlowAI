import { Card, CardBody } from './ui/Card';
import { Badge } from './ui/Badge';
import { Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface EmailResult {
  success: boolean;
  error?: string;
}

interface EmailStatusProps {
  emailResult: EmailResult | null;
}

export const EmailStatus = ({ emailResult }: EmailStatusProps) => {
  if (!emailResult) return null;

  if (emailResult.success) {
    return (
      <Card className="mb-6 border-green-200">
        <CardBody className="flex items-center gap-3 p-6 bg-green-50">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">Email Sent Successfully</p>
            <p className="text-sm text-green-600">The expense report has been sent to the finance team.</p>
          </div>
          <Badge variant="success" className="ml-auto">Sent</Badge>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-red-200">
      <CardBody className="p-6 bg-red-50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-red-800">Email Delivery Failed</p>
            <p className="text-sm text-red-600 mt-1">{emailResult.error || 'Unknown error occurred'}</p>
            <p className="text-sm text-gray-600 mt-2">
              Configure SMTP credentials in the backend .env file to enable email sending.
            </p>
          </div>
          <Badge variant="danger" className="mt-1">Failed</Badge>
        </div>
      </CardBody>
    </Card>
  );
};