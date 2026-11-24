import { ExpenseSummary as ExpenseSummaryType } from '../types';
import { DollarSign, Receipt, Calendar, Tag } from 'lucide-react';

interface ExpenseSummaryProps {
  summary: ExpenseSummaryType | null;
}

export const ExpenseSummary = ({ summary }: ExpenseSummaryProps) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Grand Total</p>
            <p className="text-2xl font-bold text-gray-900">₹{summary.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{summary.expense_count}</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500">Date Range</p>
            <p className="text-base font-semibold text-gray-900 truncate">
              {summary.date_range.start} to {summary.date_range.end}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(summary.category_totals).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};