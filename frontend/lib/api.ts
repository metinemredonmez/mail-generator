import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// Passengers
export const passengersApi = {
  getAll: (params?: {
    search?: string;
    hasEmail?: boolean;
    page?: number;
    limit?: number;
    groupId?: string;
    nusukStatus?: string;
  }) => api.get('/passengers', { params }),
  getOne: (id: string) => api.get(`/passengers/${id}`),
  create: (data: any) => api.post('/passengers', data),
  update: (id: string, data: any) => api.put(`/passengers/${id}`, data),
  delete: (id: string) => api.delete(`/passengers/${id}`),
  bulkCreate: (passengers: any[]) => api.post('/passengers/bulk', { passengers }),
  getStats: () => api.get('/passengers/stats'),
};

// Emails
export const emailsApi = {
  getAll: (params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) =>
    api.get('/emails', { params }),
  getOne: (id: string) => api.get(`/emails/${id}`),
  createForPassenger: (passengerId: string, data?: { customUsername?: string }) =>
    api.post(`/emails/passenger/${passengerId}`, data),
  bulkCreate: (passengerIds: string[]) =>
    api.post('/emails/bulk', { passengerIds }),
  deactivate: (id: string) => api.post(`/emails/${id}/deactivate`),
  delete: (id: string) => api.delete(`/emails/${id}`),
  getCredentials: (id: string) => api.get(`/emails/${id}/credentials`),
  getStats: () => api.get('/emails/stats'),
};

// Inbox
export const inboxApi = {
  syncEmail: (emailId: string) => api.post(`/inbox/sync/${emailId}`),
  syncAll: () => api.post('/inbox/sync-all'),
  getItems: (emailId: string, params?: { hasCode?: boolean; unreadOnly?: boolean; page?: number }) =>
    api.get(`/inbox/email/${emailId}`, { params }),
  getItem: (itemId: string) => api.get(`/inbox/item/${itemId}`),
  getAllCodes: (params?: { page?: number; limit?: number; unused?: boolean }) =>
    api.get('/inbox/codes', { params }),
  markAsRead: (itemId: string) => api.post(`/inbox/item/${itemId}/read`),
  markCodeUsed: (itemId: string) => api.post(`/inbox/item/${itemId}/code-used`),
  markMultipleAsRead: (itemIds: string[]) =>
    api.post('/inbox/mark-read', { itemIds }),
  addMockItem: (emailId: string, data: { subject: string; from: string; body: string; code?: string }) =>
    api.post(`/inbox/mock/${emailId}`, data),
};

// Groups
export const groupsApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/groups', { params }),
  getOne: (id: string) => api.get(`/groups/${id}`),
  create: (data: { name: string; description?: string; startDate?: string; endDate?: string }) =>
    api.post('/groups', data),
  update: (id: string, data: any) => api.put(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
  addPassengers: (id: string, passengerIds: string[]) =>
    api.post(`/groups/${id}/passengers`, { passengerIds }),
  removePassengers: (id: string, passengerIds: string[]) =>
    api.delete(`/groups/${id}/passengers`, { data: { passengerIds } }),
  getStats: () => api.get('/groups/stats'),
};
