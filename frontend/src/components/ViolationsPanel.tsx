import { Violation } from '../types';
import { Card, CardBody } from './ui/Card';
import { Badge } from './ui/Badge';
import { AlertTriangle, DollarSign } from 'lucide-react';

interface ViolationsPanelProps {
  violations: Violation[];
  approvalPending: boolean;
}

export const ViolationsPanel = ({ violations, approvalPending }: ViolationsPanelProps) => {
  if (!violations.length) {
    return (
      <Card className="mb-6">
        <CardBody className="flex items-center gap-3 p-6 bg-green-50">
          <div className="p-2 bg-green-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">No Policy Violations</p>
            <p className="text-sm text-green-600">All expenses comply with company policies.</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const severityColors: Record<Violation['severity'], 'info' | 'warning' | 'danger'> = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
  } as const;

  return (
    <Card className="mb-6 border-red-200">
      <div className="card-header bg-red-50 border-red-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900">Policy Violations ({violations.length})</h3>
        </div>
      </div>
      <CardBody className="space-y-4">
        {violations.map((violation, index) => (
          <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date / Merchant</p>
                <p className="font-medium text-gray-900">{violation.date} - {violation.merchant}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium text-gray-900 capitalize">{violation.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Severity</p>
                <Badge variant={severityColors[violation.severity]}>{violation.severity.toUpperCase()}</Badge>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-red-200">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {violation.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Policy Limit</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {violation.limit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Excess Amount</p>
                  <p className="font-semibold text-red-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {violation.excess.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {approvalPending && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-800">
              Report requires approval due to policy violations.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};