import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Token } from '../types';
import api from '../api/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('expenseflow_user');
    const storedToken = localStorage.getItem('expenseflow_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
      } catch {
        localStorage.removeItem('expenseflow_user');
        localStorage.removeItem('expenseflow_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post<Token>('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, refresh_token } = response.data;
      const userData: User = {
        username,
        email: `${username}@company.com`,
        full_name: username === 'mohit.tade' ? 'Mohit Tade' : username,
        scopes: username === 'mohit.tade' ? ['read', 'write', 'approve'] : ['read', 'write'],
      };

      setUser(userData);
      setAccessToken(access_token);
      localStorage.setItem('expenseflow_user', JSON.stringify(userData));
      localStorage.setItem('expenseflow_token', access_token);
      localStorage.setItem('expenseflow_refresh', refresh_token);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('expenseflow_user');
    localStorage.removeItem('expenseflow_token');
    localStorage.removeItem('expenseflow_refresh');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};