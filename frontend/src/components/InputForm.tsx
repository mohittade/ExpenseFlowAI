import { useState, FormEvent } from 'react';
import { Button } from './ui/Button';
import { Textarea, Input } from './ui/Input';
import { Card, CardBody } from './ui/Card';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import type { ExpenseRequest } from '../types';

interface InputFormProps {
  onSubmit: (request: ExpenseRequest) => void;
  loading: boolean;
  sampleRequests: string[];
  onSampleClick: (request: string) => void;
}

export const InputForm = ({ onSubmit, loading, sampleRequests, onSampleClick }: InputFormProps) => {
  const [formData, setFormData] = useState<ExpenseRequest>({
    user_request: '',
    employee_id: 1,
    employee_name: 'John Doe',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.user_request.trim()) {
      onSubmit(formData);
    }
  };

  const handleSampleClick = (sample: string) => {
    setFormData(prev => ({ ...prev, user_request: sample }));
    onSampleClick(sample);
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate Expense Report</h2>
            <p className="text-sm text-gray-500">Describe what you need in natural language</p>
          </div>
        </div>
      </div>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Textarea
            label="Your Request"
            value={formData.user_request}
            onChange={(e) => setFormData(prev => ({ ...prev, user_request: e.target.value }))}
            placeholder="e.g., Generate my travel expense report for July 2025 and email it to finance."
            rows={4}
            helperText="Try: 'Create expense report for last month' or 'Generate travel expense report for August 2025'"
            disabled={loading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Employee ID"
              type="number"
              value={formData.employee_id}
              onChange={(e) => setFormData(prev => ({ ...prev, employee_id: parseInt(e.target.value) || 1 }))}
              min={1}
              disabled={loading}
            />
            <Input
              label="Employee Name"
              value={formData.employee_name}
              onChange={(e) => setFormData(prev => ({ ...prev, employee_name: e.target.value }))}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" disabled={!formData.user_request.trim() || loading}>
            <Send className="w-5 h-5 mr-2" />
            {loading ? 'Generating Report...' : 'Generate Report'}
          </Button>
        </form>

        {sampleRequests.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Examples:</p>
            <div className="flex flex-wrap gap-2">
              {sampleRequests.map((sample, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSampleClick(sample)}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors disabled:opacity-50"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};