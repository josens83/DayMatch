import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

// Admin API endpoints
export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getDashboardCharts: (period: string) => api.get(`/admin/dashboard/charts?period=${period}`),

  // Users
  getUsers: (params: Record<string, any>) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  suspendUser: (id: string, reason: string) => api.post(`/admin/users/${id}/suspend`, { reason }),
  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),

  // Jobs
  getJobs: (params: Record<string, any>) => api.get('/admin/jobs', { params }),
  getJob: (id: string) => api.get(`/admin/jobs/${id}`),
  updateJob: (id: string, data: any) => api.patch(`/admin/jobs/${id}`, data),
  deleteJob: (id: string) => api.delete(`/admin/jobs/${id}`),

  // Matches
  getMatches: (params: Record<string, any>) => api.get('/admin/matches', { params }),
  getMatch: (id: string) => api.get(`/admin/matches/${id}`),

  // Payments
  getPayments: (params: Record<string, any>) => api.get('/admin/payments', { params }),
  getPayment: (id: string) => api.get(`/admin/payments/${id}`),
  refundPayment: (id: string, reason: string) => api.post(`/admin/payments/${id}/refund`, { reason }),

  // Reports
  getReports: (params: Record<string, any>) => api.get('/admin/reports', { params }),
  getReport: (id: string) => api.get(`/admin/reports/${id}`),
  resolveReport: (id: string, action: string, note: string) =>
    api.post(`/admin/reports/${id}/resolve`, { action, note }),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.patch('/admin/settings', data),
};
