import { Expense, Violation, MissingData } from '../types';
import { Card, CardBody } from './ui/Card';
import { Badge } from './ui/Badge';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface ExpenseTableProps {
  expenses: Expense[];
  violations?: Violation[];
  missingData?: MissingData[];
}

const violationMap = new Map<string, Violation>();
const missingMap = new Map<string, MissingData>();

export const ExpenseTable = ({ expenses, violations = [], missingData = [] }: ExpenseTableProps) => {
  violationMap.clear();
  missingMap.clear();

  violations.forEach((v) => {
    const key = `${v.date}-${v.merchant}-${v.amount}`;
    violationMap.set(key, v);
  });

  missingData.forEach((m) => {
    const key = `${m.date}-${m.merchant}-${m.issue}`;
    missingMap.set(key, m);
  });

  const getRowStatus = (expense: Expense) => {
    const key = `${expense.date}-${expense.merchant}-${expense.amount}`;
    if (violationMap.has(key)) return 'violation';
    if (missingData.some(m => m.date === expense.date && m.merchant === expense.merchant)) return 'missing';
    return 'ok';
  };

  if (!expenses.length) {
    return (
      <Card className="mb-6">
        <CardBody className="py-12 text-center">
          <p className="text-gray-500">No expenses found for the selected period.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">Detailed Expenses</h3>
      </div>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Merchant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((expense, index) => {
                const status = getRowStatus(expense);
                const violationKey = `${expense.date}-${expense.merchant}-${expense.amount}`;
                const violation = violationMap.get(violationKey);

                return (
                  <tr key={index} className={`hover:bg-gray-50 transition-colors ${status === 'violation' ? 'bg-red-50' : status === 'missing' ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{expense.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.merchant}</td>
                    <td className="px-4 py-3 text-sm">
                      {expense.category ? (
                        <Badge variant="neutral">{expense.category}</Badge>
                      ) : (
                        <Badge variant="warning">Uncategorized</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {expense.description || <span className="text-gray-400 italic">No description</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {expense.receipt_path ? (
                        <FileText className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {status === 'violation' && (
                        <Badge variant="danger" size="sm">
                          Violation: ₹{violation?.excess.toLocaleString(undefined, { minimumFractionDigits: 2 })} over limit
                        </Badge>
                      )}
                      {status === 'missing' && (
                        <Badge variant="warning" size="sm">Missing Data</Badge>
                      )}
                      {status === 'ok' && (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" /> OK
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
};