import { ExpenseSummary } from '../types';
import { Card, CardBody } from './ui/Card';
import { Progress } from './ui/Progress';

interface CategoryBreakdownProps {
  summary: ExpenseSummary | null;
}

export const CategoryBreakdown = ({ summary }: CategoryBreakdownProps) => {
  if (!summary?.breakdown?.length) return null;

  return (
    <Card className="mb-6">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">Expenses by Category</h3>
      </div>
      <CardBody className="space-y-4">
        {summary.breakdown.map((item) => (
          <div key={item.category} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700 capitalize">{item.category}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{item.count} transactions</span>
                <span className="font-semibold text-gray-900">₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="text-primary-600 font-medium">({item.percentage.toFixed(1)}%)</span>
              </div>
            </div>
            <Progress value={item.percentage} max={100} className="h-2" />
          </div>
        ))}
      </CardBody>
    </Card>
  );
};