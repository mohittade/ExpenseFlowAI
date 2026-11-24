import { MissingData } from '../types';
import { Card, CardBody } from './ui/Card';
import { Badge } from './ui/Badge';
import { AlertCircle, Info } from 'lucide-react';

interface MissingDataPanelProps {
  missingData: MissingData[];
  approvalPending: boolean;
}

export const MissingDataPanel = ({ missingData, approvalPending }: MissingDataPanelProps) => {
  if (!missingData.length) {
    return (
      <Card className="mb-6">
        <CardBody className="flex items-center gap-3 p-6 bg-green-50">
          <div className="p-2 bg-green-100 rounded-lg">
            <Info className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">No Missing Data</p>
            <p className="text-sm text-green-600">All expenses have complete information.</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const severityColors: Record<MissingData['severity'], 'info' | 'warning' | 'danger'> = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
  } as const;

  return (
    <Card className="mb-6 border-yellow-200">
      <div className="card-header bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-900">Missing Data / Exceptions ({missingData.length})</h3>
        </div>
      </div>
      <CardBody className="space-y-4">
        {missingData.map((item, index) => (
          <div key={index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date / Merchant</p>
                <p className="font-medium text-gray-900">{item.date} - {item.merchant}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issue</p>
                <p className="font-medium text-gray-900">{item.issue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Severity</p>
                <Badge variant={severityColors[item.severity]}>{item.severity.toUpperCase()}</Badge>
              </div>
              {item.details && (
                <div className="md:col-span-3 pt-2 border-t border-yellow-200">
                  <p className="text-sm text-gray-500">Details</p>
                  <p className="text-gray-900">{item.details}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {approvalPending && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-800">
              Report requires approval due to missing data.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};