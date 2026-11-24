import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './hooks/useAuth';
import { Overview } from './pages/Overview';
import { GenerateReport } from './pages/GenerateReport';
import { ReportsHistory } from './pages/ReportsHistory';
import { AgentMonitoring } from './pages/AgentMonitoring';
import { Approvals } from './pages/Approvals';
import { Transactions } from './pages/Transactions';
import { Settings } from './pages/Settings';
import { useAuth } from './hooks/useAuth';
import { Card, CardBody } from './components/ui/Card';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" aria-label="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" aria-label="Loading..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('mohit.tade@company.com');
  const [password, setPassword] = React.useState('mohit123');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // The backend expects a username (without domain), extract it from email
      const username = email.includes('@') ? email.split('@')[0] : email;
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-6 p-3 bg-primary-100 rounded-xl w-fit">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-display-sm font-bold text-text-primary">Welcome back</h1>
            <p className="text-text-secondary mt-2">Sign in to ExpenseFlow AI</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="input-label">Email</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="mohit.tade@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="input-label">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-primary-600 border-border-default rounded focus:ring-2 focus:ring-primary-500" />
                <span className="text-body-sm text-text-secondary">Remember me</span>
              </label>
              <a href="#" className="text-body-sm text-primary-600 hover:text-primary-700">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-body-lg"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-border-default">
            <p className="text-center text-body-sm text-text-tertiary">
              Demo credentials: mohit.tade@company.com / mohit123
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      <Route element={<ProtectedRoute />}>
        <Route index element={<Overview />} />
        <Route path="generate" element={<GenerateReport />} />
        <Route path="history" element={<ReportsHistory />} />
        <Route path="monitoring" element={<AgentMonitoring />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="reports/:runId" element={<ReportsHistory />} />
        <Route path="settings" element={<Settings />} />
        <Route path="logs" element={<Overview />} />
        <Route path="profile" element={<Overview />} />
        <Route path="notifications" element={<Overview />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider position="top-right" maxToasts={5}>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;