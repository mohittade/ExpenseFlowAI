import { ExecutionLog } from '../types';
import { Card, CardBody } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ChevronDown, ChevronUp, Terminal, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ExecutionLogsProps {
  logs: ExecutionLog[];
  runId: string;
  loading: boolean;
  onRefresh: () => void;
}

const statusIcons = {
  completed: CheckCircle,
  failed: XCircle,
  running: Loader2,
};

const statusColors = {
  completed: 'success',
  failed: 'danger',
  running: 'info',
} as const;

const statusLabels = {
  completed: 'Completed',
  failed: 'Failed',
  running: 'Running',
};

export const ExecutionLogs = ({ logs, runId, loading, onRefresh }: ExecutionLogsProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!logs.length) return null;

  return (
    <Card className="mb-6">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Execution Logs</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      {expanded && (
        <CardBody className="p-0">
          <div className="bg-gray-900 text-gray-100 font-mono text-sm max-h-96 overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Agent</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  const StatusIcon = statusIcons[log.status];
                  return (
                    <tr key={index} className="border-t border-gray-700 hover:bg-gray-800">
                      <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{log.created_at}</td>
                      <td className="px-4 py-2 text-gray-300">{log.agent_name}</td>
                      <td className="px-4 py-2 text-gray-100">{log.action}</td>
                      <td className="px-4 py-2 text-center">
                        <Badge variant={statusColors[log.status]} className="flex items-center justify-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {statusLabels[log.status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {logs.some(log => log.details) && (
              <div className="px-4 py-4 border-t border-gray-700">
                <p className="text-gray-400 mb-2">Details:</p>
                <div className="space-y-1">
                  {logs.map((log, index) =>
                    log.details && (
                      <div key={index} className="text-gray-300 pl-4 border-l-2 border-gray-700">
                        <span className="text-gray-500">[{log.agent_name}] </span>
                        {log.details}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      )}
    </Card>
  );
};