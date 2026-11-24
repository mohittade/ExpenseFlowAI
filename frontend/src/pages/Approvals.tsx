import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Info,
  DollarSign,
  Mail,
  Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, Pagination } from '../components/ui/Table';
import { Dropdown, DropdownDivider } from '../components/ui/Dropdown';
import { SkeletonTable } from '../components/ui/Skeleton';
import { useExpenseReport } from '../hooks/useExpenseReport';
import { downloadReport, getReports } from '../api/client';
import toast from 'react-hot-toast';

interface ApprovalItem {
  run_id: string;
  employee_name: string;
  employee_id: number;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: 'pending_approval' | 'completed' | 'rejected' | 'failed';
  created_at: string;
  pdf_path: string | null;
  violations_count: number;
  missing_data_count: number;
  violations: Array<{ category: string; amount: number; limit: number; excess: number }>;
  missing_data: Array<{ issue: string; details: string }>;
}

const statusConfig = {
  pending_approval: { label: 'Pending Review', color: 'warning', icon: Clock },
  completed: { label: 'Approved', color: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'danger', icon: XCircle },
  failed: { label: 'Failed', color: 'danger', icon: XCircle },
};

export const Approvals = () => {
  const navigate = useNavigate();
  const { handleApproval } = useExpenseReport();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [approvalStatuses, setApprovalStatuses] = useState<Record<string, ApprovalItem['status']>>({});
  const [emailStatus, setEmailStatus] = useState<Record<string, 'sending' | 'sent' | 'failed' | null>>({});

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getReports(100, 0);
      setApprovals(response.reports as ApprovalItem[]);
    } catch {
      toast.error('Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const filteredApprovals = useMemo(() => {
    let result = [...approvals];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.run_id.toLowerCase().includes(query) ||
          r.employee_name.toLowerCase().includes(query) ||
          r.total_amount.toString().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(
        (r) => (approvalStatuses[r.run_id] ?? r.status) === statusFilter
      );
    }

    return result;
  }, [approvals, approvalStatuses, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredApprovals.length / itemsPerPage);
  const paginatedApprovals = filteredApprovals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApprove = async (runId: string, approved: boolean) => {
    setProcessing(runId);
    try {
      const approvalResult = await handleApproval(runId, approved);
      // Update local status so the row re-renders immediately
      setApprovalStatuses((prev) => ({ ...prev, [runId]: approved ? 'completed' : 'rejected' }));
      toast.success(approved ? 'Report approved!' : 'Report rejected');

      if (approved) {
        if (approvalResult?.email_error) {
          setEmailStatus((prev) => ({ ...prev, [runId]: 'failed' }));
          toast.error(`Email failed: ${approvalResult.email_error}`);
        } else {
          setEmailStatus((prev) => ({ ...prev, [runId]: 'sent' }));
          toast.success('Report emailed to finance team');
        }
      }
      await fetchApprovals();
    } catch (error) {
      toast.error('Failed to update approval');
    } finally {
      setProcessing(null);
    }
  };

  const handleDownload = async (runId: string) => {
    try {
      const blob = await downloadReport(runId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense_report_${runId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleView = (runId: string) => {
    navigate(`/reports/${runId}`);
  };

  const actionItems = (approval: ApprovalItem) => [
    {
      label: (
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </div>
      ),
      onClick: () => handleView(approval.run_id),
    },
    approval.pdf_path && {
      label: (
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </div>
      ),
      onClick: () => handleDownload(approval.run_id),
    },
  ].filter(Boolean) as Array<{ label: React.ReactNode; onClick: () => void }>;

  const columns = [
    {
      key: 'run_id',
      header: 'Report ID',
      render: (approval: ApprovalItem) => (
        <span className="font-mono text-body-sm text-text-primary">{approval.run_id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'employee_name',
      header: 'Employee',
      render: (approval: ApprovalItem) => (
        <div>
          <p className="font-medium text-text-primary">{approval.employee_name}</p>
          <p className="text-body-xs text-text-tertiary">ID: {approval.employee_id}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (approval: ApprovalItem) => (
        <div>
          <p className="text-text-primary">{format(parseISO(approval.period_start), 'MMM d, yyyy')}</p>
          <p className="text-body-xs text-text-tertiary">to {format(parseISO(approval.period_end), 'MMM d, yyyy')}</p>
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (approval: ApprovalItem) => (
        <span className="font-semibold text-text-primary">₹{approval.total_amount.toLocaleString()}</span>
      ),
      align: 'right' as const,
    },
    {
      key: 'issues',
      header: 'Issues',
      render: (approval: ApprovalItem) => (
        <div className="flex items-center gap-2">
          {approval.violations_count > 0 && (
            <Badge variant="danger" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {approval.violations_count}
            </Badge>
          )}
          {approval.missing_data_count > 0 && (
            <Badge variant="warning" className="gap-1">
              <Info className="w-3 h-3" />
              {approval.missing_data_count}
            </Badge>
          )}
          {approval.violations_count === 0 && approval.missing_data_count === 0 && (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              Clean
            </Badge>
          )}
        </div>
      ),
      align: 'center' as const,
    },
    {
      key: 'status',
      header: 'Status',
      render: (approval: ApprovalItem) => {
        const liveStatus = approvalStatuses[approval.run_id] ?? approval.status;
        const config = statusConfig[liveStatus];
        const Icon = config.icon;
        const eStatus = emailStatus[approval.run_id];
        return (
          <div className="flex flex-col items-center gap-1">
            <Badge variant={config.color as any} className="gap-1">
              <Icon className="w-3 h-3" />
              {config.label}
            </Badge>
            {eStatus === 'sending' && (
              <Badge variant="info" className="gap-1 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                Sending email…
              </Badge>
            )}
            {eStatus === 'sent' && (
              <Badge variant="success" className="gap-1 text-xs">
                <Mail className="w-3 h-3" />
                Email sent
              </Badge>
            )}
            {eStatus === 'failed' && (
              <Badge variant="danger" className="gap-1 text-xs">
                <Mail className="w-3 h-3" />
                Email failed
              </Badge>
            )}
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      key: 'created_at',
      header: 'Submitted',
      render: (approval: ApprovalItem) => (
        <span className="text-body-sm text-text-secondary">{format(parseISO(approval.created_at), 'MMM d, yyyy HH:mm')}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (approval: ApprovalItem) => {
        const liveStatus = approvalStatuses[approval.run_id] ?? approval.status;
        if (liveStatus !== 'pending_approval') {
          return (
            <Dropdown
              trigger={<Button variant="ghost" size="icon" className="p-1.5"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></Button>}
              items={actionItems(approval)}
              align="right"
            />
          );
        }

        const isProcessing = processing === approval.run_id;
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => handleApprove(approval.run_id, true)}
              disabled={isProcessing}
              className="gap-1.5"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Approve & Send
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleApprove(approval.run_id, false)}
              disabled={isProcessing}
              className="gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
          </div>
        );
      },
      align: 'center' as const,
    },
  ];

  const pendingCount = approvals.filter((a) => (approvalStatuses[a.run_id] ?? a.status) === 'pending_approval').length;
  const approvedCount = approvals.filter((a) => (approvalStatuses[a.run_id] ?? a.status) === 'completed').length;
  const rejectedCount = approvals.filter((a) => (approvalStatuses[a.run_id] ?? a.status) === 'rejected').length;

  return (
    <DashboardLayout
      pageTitle="Approvals"
      breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Approvals' }]}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display-sm font-bold text-text-primary">Approvals</h1>
            <p className="text-text-secondary mt-1">Review and approve expense reports requiring attention</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Pending Review</p>
                <p className="text-display-sm font-bold text-text-primary">{pendingCount}</p>
              </div>
              <div className="p-3 bg-warning-100 rounded-xl">
                <Clock className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Approved</p>
                <p className="text-display-sm font-bold text-text-primary">{approvedCount}</p>
              </div>
              <div className="p-3 bg-success-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Rejected</p>
                <p className="text-display-sm font-bold text-text-primary">{rejectedCount}</p>
              </div>
              <div className="p-3 bg-danger-100 rounded-xl">
                <XCircle className="w-6 h-6 text-danger-600" />
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <CardBody className="p-0">
            <div className="p-4 border-b border-border-default flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search approvals..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="input-field pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="input-field w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="pending_approval">Pending</option>
                <option value="completed">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <Table
              columns={columns}
              data={paginatedApprovals}
              keyExtractor={(a) => a.run_id}
              hoverable
              striped
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredApprovals.length}
              itemsPerPage={itemsPerPage}
            />
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
};