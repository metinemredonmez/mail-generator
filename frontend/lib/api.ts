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
  getById: (id: string) => api.get(`/passengers/${id}`),
  getOne: (id: string) => api.get(`/passengers/${id}`),
  create: (data: any) => {
    // undefined ve bos string alanlari cikar
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    return api.post('/passengers', cleanData);
  },
  update: (id: string, data: any) => api.put(`/passengers/${id}`, data),
  delete: (id: string) => api.delete(`/passengers/${id}`),
  bulkDelete: (ids: string[]) => api.post('/passengers/bulk-delete', { ids }),
  bulkCreate: (passengers: any[]) => api.post('/passengers/bulk', { passengers }),
  getStats: () => api.get('/passengers/stats'),
  export: (params?: { groupId?: string; format?: 'xlsx' | 'csv' }) =>
    api.get('/passengers/export', { params, responseType: 'blob' }),
};

// Emails
export const emailsApi = {
  getAll: (params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) =>
    api.get('/emails', { params }),
  getOne: (id: string) => api.get(`/emails/${id}`),
  createForPassenger: (passengerId: string, data?: { customUsername?: string }) =>
    api.post(`/emails/passenger/${passengerId}`, data),
  bulkCreate: (data: { passengerIds: string[] }) =>
    api.post('/emails/bulk', data),
  bulkDelete: (data: { emailIds: string[] }) =>
    api.post('/emails/bulk-delete', data),
  update: (id: string, data: { isActive?: boolean }) =>
    api.patch(`/emails/${id}`, data),
  deactivate: (id: string) => api.post(`/emails/${id}/deactivate`),
  delete: (id: string) => api.delete(`/emails/${id}`),
  getCredentials: (id: string) => api.get(`/emails/${id}/credentials`),
  getStats: () => api.get('/emails/stats'),
};

// Inbox
export const inboxApi = {
  syncEmail: (emailId: string) => api.post(`/inbox/sync/${emailId}`),
  sync: (emailId: string) => api.post(`/inbox/sync/${emailId}`),
  syncAll: () => api.post('/inbox/sync-all'),
  getAll: (params?: { emailId?: string; hasCode?: boolean; unreadOnly?: boolean; page?: number; limit?: number }) =>
    api.get('/inbox', { params }),
  getItems: (emailId: string, params?: { hasCode?: boolean; unreadOnly?: boolean; page?: number }) =>
    api.get(`/inbox/email/${emailId}`, { params }),
  getItem: (itemId: string) => api.get(`/inbox/item/${itemId}`),
  getAllCodes: (params?: { page?: number; limit?: number; unused?: boolean }) =>
    api.get('/inbox/codes', { params }),
  getAllMessages: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/inbox/messages', { params }),
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
  getById: (id: string) => api.get(`/groups/${id}`),
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

// Settings
export const settingsApi = {
  getAll: () => api.get('/settings'),
  getAllRaw: () => api.get('/settings/raw'),
  getMailConfig: () => api.get('/settings/mail-config'),
  get: (key: string) => api.get(`/settings/${key}`),
  set: (key: string, value: string, type?: string) =>
    api.post('/settings', { key, value, type }),
  update: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
  bulkUpdate: (settings: Record<string, string>) =>
    api.put('/settings/bulk', { settings }),
  delete: (key: string) => api.delete(`/settings/${key}`),
  initialize: () => api.post('/settings/initialize'),
};

// Activity
export const activityApi = {
  getAll: (params?: {
    action?: string;
    entity?: string;
    adminId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/activity', { params }),
  getSummary: () => api.get('/activity/summary'),
  getByEntity: (entity: string, entityId: string) =>
    api.get(`/activity/entity/${entity}/${entityId}`),
  cleanup: (days: number) => api.delete(`/activity/cleanup/${days}`),
};

// Health
export const healthApi = {
  check: () => api.get('/health'),
  detailed: () => api.get('/health/detailed'),
};

// Passengers - Excel Import
export const passengersImportApi = {
  uploadExcel: (file: File, groupId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (groupId) formData.append('groupId', groupId);
    return api.post('/passengers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadTemplate: () =>
    api.get('/passengers/template', { responseType: 'blob' }),
};

// Emails - Extended
export const emailsExtendedApi = {
  testConnection: () => api.post('/emails/test-connection'),
  getServerConfig: () => api.get('/emails/server-config'),
};

// Notifications
export const notificationsApi = {
  getAll: (params?: { unreadOnly?: boolean; limit?: number; page?: number }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  cleanup: (days: number) => api.delete(`/notifications/cleanup/${days}`),
};
