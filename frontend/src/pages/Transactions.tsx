import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Tag,
  Calendar,
  CreditCard,
  Building2,
  ArrowDownUp,
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
import { Tabs, TabPanel } from '../components/ui/Tabs';
import { Progress } from '../components/ui/Progress';

interface Transaction {
  id: number;
  date: string;
  merchant: string;
  category: string | null;
  amount: number;
  description: string | null;
  receipt_path: string | null;
  employee_id: number;
  employee_name: string;
  policy_limit?: number;
  is_violation?: boolean;
  violation_excess?: number;
}

const mockTransactions: Transaction[] = [
  { id: 1, date: '2026-07-14', merchant: 'Home Depot', category: 'Supplies', amount: 491.13, description: 'Cloud storage upgrade', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 25000, is_violation: false },
  { id: 2, date: '2026-12-28', merchant: 'JetBlue Airways', category: null, amount: 1065.41, description: 'Flight to San Diego for Tech Summit', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: false },
  { id: 3, date: '2026-02-10', merchant: "Morton's Steakhouse", category: 'Meals', amount: 41.59, description: 'Networking dinner', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 3000, is_violation: false },
  { id: 4, date: '2025-01-22', merchant: 'British Airways', category: 'Flights', amount: 550.16, description: 'Economy flight to Denver for client meeting', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: false },
  { id: 5, date: '2026-06-22', merchant: 'Alamo', category: 'Transport', amount: 154.69, description: 'Local transportation in Houston', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 3000, is_violation: false },
  { id: 6, date: '2025-08-22', merchant: 'PyCon India', category: 'Registration', amount: 91231.80, description: 'Registration for PyCon India', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 50000, is_violation: true, violation_excess: 41231.80 },
  { id: 7, date: '2026-06-15', merchant: 'Flipkart', category: 'Supplies', amount: 49786.34, description: 'External Monitor', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 25000, is_violation: true, violation_excess: 24786.34 },
  { id: 8, date: '2026-10-19', merchant: 'SpiceJet', category: 'Flights', amount: 44872.79, description: 'Flight to Bengaluru', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: true, violation_excess: 9872.79 },
  { id: 9, date: '2026-11-17', merchant: 'StationeryKart', category: 'Supplies', amount: 42824.42, description: 'Monitor for remote work', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 25000, is_violation: true, violation_excess: 17824.42 },
  { id: 10, date: '2025-01-09', merchant: 'TruJet', category: 'Flights', amount: 42729.57, description: 'Flight to Mumbai', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: true, violation_excess: 7729.57 },
  { id: 11, date: '2026-07-16', merchant: 'Tech Conference Registration', category: 'Registration', amount: 25241.90, description: 'AWS Community Day registration', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 50000, is_violation: false },
  { id: 12, date: '2025-04-14', merchant: 'Node.js Conf', category: 'Registration', amount: 24192.80, description: 'Node.js Conference', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 50000, is_violation: false },
  { id: 13, date: '2026-08-01', merchant: 'SpiceJet', category: 'Flights', amount: 44083.33, description: 'Flight to Delhi', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: true, violation_excess: 9083.33 },
  { id: 14, date: '2025-09-15', merchant: 'Croma', category: 'Supplies', amount: 43827.86, description: 'Laptop accessories', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 25000, is_violation: true, violation_excess: 18827.86 },
  { id: 15, date: '2025-01-10', merchant: 'JetBlue Airways', category: 'Flights', amount: 11788.70, description: 'Flight to Chennai', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: false },
  { id: 16, date: '2025-06-02', merchant: 'American Airlines', category: 'Flights', amount: 11478.10, description: 'Flight to Hyderabad', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: false },
  { id: 17, date: '2025-10-11', merchant: 'American Airlines', category: 'Flights', amount: 11141.50, description: 'Flight to Kolkata', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: false },
  { id: 18, date: '2025-02-26', merchant: 'British Airways', category: 'Flights', amount: 10513.90, description: 'Flight to Pune', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: false },
  { id: 19, date: '2026-06-03', merchant: 'Qatar Airways', category: 'Flights', amount: 11342.40, description: 'Flight to Dubai', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: false },
  { id: 20, date: '2025-08-15', merchant: 'Qatar Airways', category: 'Flights', amount: 11947.20, description: 'Flight to Singapore', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: false },
  { id: 21, date: '2025-03-15', merchant: 'Vistara', category: 'Flights', amount: 8923.40, description: 'Flight to Goa', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 35000, is_violation: false },
  { id: 22, date: '2026-04-20', merchant: 'JW Marriott Pune', category: 'Lodging', amount: 24500.00, description: 'Hotel stay 3 nights', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 15000, is_violation: true, violation_excess: 9500 },
  { id: 23, date: '2025-11-10', merchant: 'Conrad Pune', category: 'Lodging', amount: 18750.00, description: 'Conference hotel 2 nights', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 15000, is_violation: true, violation_excess: 3750 },
  { id: 24, date: '2026-02-05', merchant: 'Malaka Spice', category: 'Meals', amount: 4500.00, description: 'Client dinner', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 3000, is_violation: true, violation_excess: 1500 },
  { id: 25, date: '2025-07-20', merchant: 'Uber Pune', category: 'Transport', amount: 3500.00, description: 'Airport transfer', receipt_path: null, employee_id: 1, employee_name: 'Mohit Tade', policy_limit: 3000, is_violation: true, violation_excess: 500 },
];

const categoryColors: Record<string, string> = {
  Flights: 'bg-blue-100 text-blue-700',
  Lodging: 'bg-purple-100 text-purple-700',
  Meals: 'bg-green-100 text-green-700',
  Transport: 'bg-orange-100 text-orange-700',
  Supplies: 'bg-gray-100 text-gray-700',
  Registration: 'bg-pink-100 text-pink-700',
  Entertainment: 'bg-yellow-100 text-yellow-700',
  Communication: 'bg-indigo-100 text-indigo-700',
};

export const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [sortState, setSortState] = useState<{ column: string; direction: 'asc' | 'desc' | 'none' }>({ column: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [activeTab, setActiveTab] = useState('all');

  const categories = [...new Set(mockTransactions.map((t) => t.category).filter(Boolean))] as string[];

  const tabs = [
    { id: 'all', label: 'All Transactions' },
    { id: 'violations', label: 'Policy Violations' },
    { id: 'missing', label: 'Missing Data' },
    { id: 'recent', label: 'Recent' },
  ];

  const filteredTransactions = useMemo(() => {
    let result = [...mockTransactions];

    if (activeTab === 'violations') {
      result = result.filter((t) => t.is_violation);
    } else if (activeTab === 'missing') {
      result = result.filter((t) => !t.category || !t.description);
    } else if (activeTab === 'recent') {
      result = result.slice(0, 20);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.merchant.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query) ||
          t.amount.toString().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'violation') {
        result = result.filter((t) => t.is_violation);
      } else if (statusFilter === 'clean') {
        result = result.filter((t) => !t.is_violation);
      } else if (statusFilter === 'missing_category') {
        result = result.filter((t) => !t.category);
      } else if (statusFilter === 'missing_description') {
        result = result.filter((t) => !t.description);
      }
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
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      result = result.filter((t) => new Date(t.date) >= startDate);
    }

    if (sortState.direction !== 'none') {
      result.sort((a, b) => {
        let aVal: any = a[sortState.column as keyof Transaction];
        let bVal: any = b[sortState.column as keyof Transaction];

        if (sortState.column === 'date') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [searchQuery, categoryFilter, statusFilter, dateRangeFilter, sortState, activeTab]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
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

  const violationCount = mockTransactions.filter((t) => t.is_violation).length;
  const missingCategoryCount = mockTransactions.filter((t) => !t.category).length;
  const missingDescriptionCount = mockTransactions.filter((t) => !t.description).length;
  const totalAmount = mockTransactions.reduce((sum, t) => sum + t.amount, 0);

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (t: Transaction) => <span className="font-mono text-body-sm text-text-primary">{format(parseISO(t.date), 'MMM d, yyyy')}</span>,
    },
    {
      key: 'merchant',
      header: 'Merchant',
      render: (t: Transaction) => (
        <div>
          <p className="font-medium text-text-primary">{t.merchant}</p>
          <p className="text-body-xs text-text-tertiary">{t.employee_name}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (t: Transaction) => {
        if (!t.category) {
          return <Badge variant="warning" size="sm">Uncategorized</Badge>;
        }
        return (
          <Badge className={categoryColors[t.category] || 'badge-neutral'} size="sm">
            {t.category}
          </Badge>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t: Transaction) => (
        <div className="text-right">
          <p className="font-semibold text-text-primary">₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          {t.policy_limit && (
            <Progress value={Math.min((t.amount / t.policy_limit) * 100, 100)} max={100} className="h-1 mt-1 w-32 ml-auto" />
          )}
        </div>
      ),
      align: 'right' as const,
    },
    {
      key: 'description',
      header: 'Description',
      render: (t: Transaction) => (
        <span className={!t.description ? 'text-text-tertiary italic' : 'text-text-secondary'}>{t.description || 'No description'}</span>
      ),
    },
    {
      key: 'receipt',
      header: 'Receipt',
      align: 'center' as const,
      render: (t: Transaction) => (
        t.receipt_path ? (
          <FileText className="w-5 h-5 text-success-500 mx-auto" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-warning-500 mx-auto" />
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center' as const,
      render: (t: Transaction) => {
        if (t.is_violation) {
          return (
            <Badge variant="danger" size="sm" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              Violation
            </Badge>
          );
        }
        if (!t.category || !t.description) {
          return (
            <Badge variant="warning" size="sm" className="gap-1">
              <Info className="w-3 h-3" />
              Incomplete
            </Badge>
          );
        }
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            OK
          </Badge>
        );
      },
    },
  ];

  const Info = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <DashboardLayout
      pageTitle="Transactions"
      breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Transactions' }]}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display-sm font-bold text-text-primary">Transactions</h1>
            <p className="text-text-secondary mt-1">Browse and analyze all expense transactions</p>
          </div>
          <Button variant="secondary" className="gap-2">
            <Download className="w-5 h-5" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Total Transactions</p>
                <p className="text-display-sm font-bold text-text-primary">{mockTransactions.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Total Amount</p>
                <p className="text-display-sm font-bold text-text-primary">₹{totalAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Policy Violations</p>
                <p className="text-display-sm font-bold text-text-primary">{violationCount}</p>
              </div>
              <div className="p-3 bg-danger-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-danger-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">Missing Data</p>
                <p className="text-display-sm font-bold text-text-primary">{missingCategoryCount + missingDescriptionCount}</p>
              </div>
              <div className="p-3 bg-warning-100 rounded-xl">
                <Tag className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </Card>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

        <Card>
          <CardBody className="p-0">
            <div className="p-4 border-b border-border-default flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="input-field pl-10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                  className="input-field w-auto"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="input-field w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="clean">Clean</option>
                  <option value="violation">Violation</option>
                  <option value="missing_category">Missing Category</option>
                  <option value="missing_description">Missing Description</option>
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
                  <option value="this_year">This Year</option>
                </select>
              </div>
            </div>

            <Table
              columns={columns}
              data={paginatedTransactions}
              keyExtractor={(t) => t.id.toString()}
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
              totalItems={filteredTransactions.length}
              itemsPerPage={itemsPerPage}
            />
          </CardBody>
        </Card>

        <section aria-labelledby="category-breakdown-heading" className="mt-6">
          <h2 id="category-breakdown-heading" className="text-heading-lg font-semibold text-text-primary mb-4">Spending by Category</h2>
          <Card>
            <CardBody>
              <div className="space-y-4">
                {categories.map((category) => {
                  const catTransactions = mockTransactions.filter((t) => t.category === category);
                  const catTotal = catTransactions.reduce((sum, t) => sum + t.amount, 0);
                  const catCount = catTransactions.length;
                  const percentage = totalAmount > 0 ? (catTotal / totalAmount) * 100 : 0;
                  const violations = catTransactions.filter((t) => t.is_violation).length;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={categoryColors[category] || 'badge-neutral'} size="md">
                            {category}
                          </Badge>
                          <div>
                            <p className="font-medium text-text-primary">{catCount} transactions</p>
                            <p className="text-body-xs text-text-tertiary">₹{catTotal.toLocaleString()} • {percentage.toFixed(1)}% of total</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-body-sm">
                          <span className="font-semibold text-text-primary">₹{catTotal.toLocaleString()}</span>
                          {violations > 0 && (
                            <Badge variant="danger" size="sm" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {violations} violations
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress value={percentage} max={100} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
};