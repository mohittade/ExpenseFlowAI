import axios from 'axios';
import type { ExpenseRequest, ExpenseResponse, ApprovalRequest, SampleRequestsResponse, ExecutionLog, Token } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('expenseflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('expenseflow_refresh');
        if (refreshToken) {
          const response = await axios.post('/auth/refresh', { refresh_token: refreshToken }, {
            baseURL: '/api',
            headers: { 'Content-Type': 'application/json' },
          });
          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('expenseflow_token', access_token);
          localStorage.setItem('expenseflow_refresh', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('expenseflow_user');
        localStorage.removeItem('expenseflow_token');
        localStorage.removeItem('expenseflow_refresh');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (username: string, password: string): Promise<Token> => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  const response = await api.post<Token>('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

export const generateReport = async (request: ExpenseRequest): Promise<ExpenseResponse> => {
  const response = await api.post<ExpenseResponse>('/generate-report', request);
  return response.data;
};

export const approveReport = async (request: ApprovalRequest): Promise<{ success: boolean; message: string; run_id: string; email_error?: string }> => {
  const response = await api.post('/approve-report', request);
  return response.data;
};

export const getLogs = async (runId: string): Promise<{ run_id: string; logs: ExecutionLog[] }> => {
  const response = await api.get(`/logs/${runId}`);
  return response.data;
};

export const getWorkflowState = async (runId: string): Promise<Record<string, any>> => {
  const response = await api.get(`/workflow/${runId}/state`);
  return response.data;
};

export const getSampleRequests = async (): Promise<SampleRequestsResponse> => {
  const response = await api.get<SampleRequestsResponse>('/sample-requests');
  return response.data;
};

export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get('/health');
  return response.data;
};

export const downloadReport = async (runId: string): Promise<Blob> => {
  const response = await api.get(`/download-report/${runId}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const sendReportEmail = async (
  runId: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const response = await api.post(`/send-report-email/${runId}`);
  return response.data;
};

export interface Report {
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

export interface ReportsResponse {
  reports: Report[];
  total: number;
}

export const getReports = async (limit = 50, offset = 0): Promise<ReportsResponse> => {
  const response = await api.get<ReportsResponse>('/reports', { params: { limit, offset } });
  return response.data;
};

export interface Contact {
  id: number;
  name: string;
  email: string;
  department: string | null;
  role: string | null;
}

export const getContacts = async (): Promise<{ contacts: Contact[] }> => {
  const response = await api.get<{ contacts: Contact[] }>('/contacts');
  return response.data;
};

export const updateContact = async (
  contactId: number,
  email: string,
  department?: string | null,
  role?: string | null
): Promise<{ success: boolean; contact: Contact }> => {
  const response = await api.put(`/contacts/${contactId}`, {
    email,
    department: department || null,
    role: role || null,
  });
  return response.data;
};

export default api;