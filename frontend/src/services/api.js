import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const campaignAPI = {
  getAll: () => api.get('/campaigns'),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  send: (id) => api.post(`/campaigns/${id}/send`),
  pause: (id) => api.patch(`/campaigns/${id}/pause`),
  delete: (id) => api.delete(`/campaigns/${id}`),
};

export const contactAPI = {
  getAll: (params = {}) => api.get('/contacts', { params }),
  create: (data) => api.post('/contacts', data),
  uploadCSV: (formData) => api.post('/contacts/upload-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  unsubscribe: (id) => api.patch(`/contacts/${id}/unsubscribe`),
  delete: (id) => api.delete(`/contacts/${id}`),
};

export default api;