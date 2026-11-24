export interface ExpenseRequest {
  user_request: string;
  employee_id: number;
  employee_name: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApprovalRequest {
  run_id: string;
  approved: boolean;
}

export interface User {
  username: string;
  email?: string;
  full_name?: string;
  scopes: string[];
}

export interface Expense {
  date: string;
  merchant: string;
  category: string | null;
  amount: number;
  description: string | null;
  receipt_path: string | null;
}

export interface ExpenseSummary {
  grand_total: number;
  expense_count: number;
  date_range: {
    start: string;
    end: string;
  };
  category_totals: Record<string, number>;
  breakdown: Array<{
    category: string;
    count: number;
    total: number;
    percentage: number;
  }>;
}

export interface Violation {
  date: string;
  merchant: string;
  category: string;
  amount: number;
  limit: number;
  excess: number;
  severity: 'low' | 'medium' | 'high';
}

export interface MissingData {
  date: string;
  merchant: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

export interface ExpenseResponse {
  run_id: string;
  current_step: string;
  approved: boolean;
  expenses: Expense[];
  summary: ExpenseSummary;
  violations: Violation[];
  missing_data: MissingData[];
  pdf_path: string | null;
  email_result: EmailResult;
  error: string | null;
}

export interface ExecutionLog {
  created_at: string;
  agent_name: string;
  action: string;
  status: 'completed' | 'failed' | 'running';
  details: string | null;
}

export interface SampleRequestsResponse {
  samples: string[];
}

export type WorkflowStep =
  | 'parse_request'
  | 'retrieve_expenses'
  | 'categorize_expenses'
  | 'check_missing_data'
  | 'validate_policies'
  | 'calculate_totals'
  | 'generate_pdf'
  | 'validate_report'
  | 'request_approval'
  | 'send_email'
  | 'error';

export const WORKFLOW_STEPS: WorkflowStep[] = [
  'parse_request',
  'retrieve_expenses',
  'categorize_expenses',
  'check_missing_data',
  'validate_policies',
  'calculate_totals',
  'generate_pdf',
  'validate_report',
  'request_approval',
  'send_email',
];

export const STEP_LABELS: Record<WorkflowStep, string> = {
  parse_request: 'Parse Request',
  retrieve_expenses: 'Retrieve Expenses',
  categorize_expenses: 'Categorize Expenses',
  check_missing_data: 'Check Missing Data',
  validate_policies: 'Validate Policies',
  calculate_totals: 'Calculate Totals',
  generate_pdf: 'Generate PDF',
  validate_report: 'Validate Report',
  request_approval: 'Request Approval',
  send_email: 'Send Email',
  error: 'Error',
};

export const STEP_ICONS: Record<WorkflowStep, string> = {
  parse_request: 'Search',
  retrieve_expenses: 'Database',
  categorize_expenses: 'Tag',
  check_missing_data: 'AlertTriangle',
  validate_policies: 'Shield',
  calculate_totals: 'Calculator',
  generate_pdf: 'FileText',
  validate_report: 'CheckCircle',
  request_approval: 'UserCheck',
  send_email: 'Send',
  error: 'XCircle',
};