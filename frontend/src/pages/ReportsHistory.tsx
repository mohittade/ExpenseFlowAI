import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  FileText,
  Download,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  Info,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, Pagination } from '../components/ui/Table';
import { Dropdown, DropdownDivider } from '../components/ui/Dropdown';
import { Skeleton, SkeletonTable } from '../components/ui/Skeleton';
import { getReports, downloadReport } from '../api/client';
import toast from 'react-hot-toast';

interface Report {
  run_id: string;
  employee_name: string;
  employee_id: number;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: 'completed' | 'pending_approval' | 'rejected' | 'failed';
  created_at: string;
  pdf_path: string | null;
  violations_count: number;
  missing_data_count: number;
}

interface ReportsResponse {
  reports: Report[];
  total: number;
}

const statusConfig = {
  completed: { label: 'Completed', color: 'success', icon: CheckCircle },
  pending_approval: { label: 'Pending Approval', color: 'warning', icon: Clock },
  rejected: { label: 'Rejected', color: 'danger', icon: XCircle },
  failed: { label: 'Failed', color: 'danger', icon: AlertTriangle },
};

export const ReportsHistory = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [sortState, setSortState] = useState<{ column: string; direction: 'asc' | 'desc' | 'none' }>({ column: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [totalReports, setTotalReports] = useState(0);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getReports(100, 0); // Fetch more for client-side filtering
      setReports(response.reports);
      setTotalReports(response.total);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = useMemo(() => {
    let result = [...reports];

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
      result = result.filter((r) => r.status === statusFilter);
    }

    if (dateRangeFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (dateRangeFilter) {
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'last_30_days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last_quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        default:
          startDate = new Date(0);
      }
      result = result.filter((r) => new Date(r.created_at) >= startDate);
    }

    if (sortState.direction !== 'none') {
      result.sort((a, b) => {
        let aVal: any = a[sortState.column as keyof Report];
        let bVal: any = b[sortState.column as keyof Report];

        if (sortState.column === 'created_at' || sortState.column === 'period_start' || sortState.column === 'period_end') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [reports, searchQuery, statusFilter, dateRangeFilter, sortState]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        if (prev.direction === 'asc') return { column, direction: 'desc' };
        if (prev.direction === 'desc') return { column, direction: 'none' };
        return { column, direction: 'asc' };
      }
      return { column, direction: 'asc' };
    });
  };

  const getSortIcon = (column: string) => {
    if (sortState.column !== column || sortState.direction === 'none') return null;
    return sortState.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const handleDownload = async (runId: string) => {
    try {
      const response = await downloadReport(runId);
      const blob = new Blob([response], { type: 'application/pdf' });
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

  const actionItems = (report: Report) => [
    {
      label: (
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </div>
      ),
      onClick: () => handleView(report.run_id),
    },
    report.pdf_path && {
      label: (
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </div>
      ),
      onClick: () => handleDownload(report.run_id),
    },
  ].filter(Boolean) as Array<{ label: React.ReactNode; onClick: () => void }>;

  const columns = [
    {
      key: 'run_id',
      header: 'Report ID',
      render: (report: Report) => (
        <span className="font-mono text-body-sm text-text-primary">{report.run_id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'employee_name',
      header: 'Employee',
      render: (report: Report) => (
        <div>
          <p className="font-medium text-text-primary">{report.employee_name}</p>
          <p className="text-body-xs text-text-tertiary">ID: {report.employee_id}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (report: Report) => (
        <div>
          <p className="text-text-primary">{format(parseISO(report.period_start), 'MMM d, yyyy')}</p>
          <p className="text-body-xs text-text-tertiary">to {format(parseISO(report.period_end), 'MMM d, yyyy')}</p>
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      render: (report: Report) => (
        <span className="font-semibold text-text-primary">₹{report.total_amount.toLocaleString()}</span>
      ),
      align: 'right' as const,
    },
    {
      key: 'issues',
      header: 'Issues',
      render: (report: Report) => (
        <div className="flex items-center gap-2">
          {report.violations_count > 0 && (
            <Badge variant="danger" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {report.violations_count}
            </Badge>
          )}
          {report.missing_data_count > 0 && (
            <Badge variant="warning" className="gap-1">
              <Info className="w-3 h-3" />
              {report.missing_data_count}
            </Badge>
          )}
          {report.violations_count === 0 && report.missing_data_count === 0 && (
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
      render: (report: Report) => {
        const config = statusConfig[report.status];
        const Icon = config.icon;
        return (
          <Badge variant={config.color as any} className="gap-1">
            <Icon className="w-3 h-3" />
            {config.label}
          </Badge>
        );
      },
      align: 'center' as const,
    },
    {
      key: 'created_at',
      header: 'Submitted',
      render: (report: Report) => (
        <span className="text-body-sm text-text-secondary">{format(parseISO(report.created_at), 'MMM d, yyyy HH:mm')}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (report: Report) => (
        <Dropdown
          trigger={<Button variant="ghost" size="icon" className="p-1.5"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></Button>}
          items={actionItems(report)}
          align="right"
        />
      ),
      align: 'center' as const,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout
        pageTitle="Reports History"
        breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Reports History' }]}
      >
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-display-sm font-bold text-text-primary">Reports History</h1>
              <p className="text-text-secondary mt-1">View and manage all generated expense reports</p>
            </div>
          </div>
          <SkeletonTable rows={itemsPerPage} columns={columns.length} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Reports History"
      breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Reports History' }]}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display-sm font-bold text-text-primary">Reports History</h1>
            <p className="text-text-secondary mt-1">View and manage all generated expense reports</p>
          </div>
        </div>

        <Card>
          <CardBody className="p-0">
            <div className="p-4 border-b border-border-default flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="input-field pl-10"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="input-field w-auto"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={dateRangeFilter}
                  onChange={(e) => { setDateRangeFilter(e.target.value); setCurrentPage(1); }}
                  className="input-field w-auto"
                >
                  <option value="all">All Time</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_quarter">Last Quarter</option>
                </select>
              </div>
            </div>

            <Table
              columns={columns}
              data={paginatedReports}
              keyExtractor={(r) => r.run_id}
              sortState={sortState}
              onSort={handleSort}
              getSortIcon={getSortIcon}
              hoverable
              striped
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredReports.length}
              itemsPerPage={itemsPerPage}
            />
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
};

