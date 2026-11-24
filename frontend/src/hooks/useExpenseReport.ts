import { useState, useCallback } from 'react';
import { generateReport, approveReport, getLogs, getSampleRequests } from '../api/client';
import type { ExpenseRequest, ExpenseResponse, SampleRequestsResponse, ExecutionLog } from '../types';

export const useExpenseReport = () => {
  const [report, setReport] = useState<ExpenseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleRequests, setSampleRequests] = useState<string[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchSampleRequests = useCallback(async () => {
    try {
      const response = await getSampleRequests();
      setSampleRequests(response.samples);
    } catch (err) {
      console.error('Failed to fetch sample requests:', err);
    }
  }, []);

  const submitRequest = useCallback(async (request: ExpenseRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateReport(request);
      setReport(result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApproval = useCallback(async (runId: string, approved: boolean) => {
    setLoading(true);
    try {
      const result = await approveReport({ run_id: runId, approved });
      if (report) {
        setReport({ ...report, approved });
      }
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update approval';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [report]);

  const fetchLogs = useCallback(async (runId: string) => {
    setLogsLoading(true);
    try {
      const response = await getLogs(runId);
      setLogs(response.logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setReport(null);
    setError(null);
    setLogs([]);
  }, []);

  return {
    report,
    loading,
    error,
    sampleRequests,
    logs,
    logsLoading,
    fetchSampleRequests,
    submitRequest,
    handleApproval,
    fetchLogs,
    reset,
  };
};