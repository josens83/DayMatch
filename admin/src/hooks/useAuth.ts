import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const response = await api.get('/admin/me');
      setState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('adminToken');
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/admin/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('adminToken', token);
    setState({ user, isAuthenticated: true, isLoading: false });
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return {
    ...state,
    login,
    logout,
    checkAuth,
  };
}
