import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds for AI responses
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const chatAPI = {
  startSession: async (title, jurisdiction) => {
    const response = await api.post('/chat/session', { title, jurisdiction });
    return response.data;
  },

  sendMessage: async (sessionId, message, urgent = false, selectedApi = 'research') => {
    const response = await api.post('/chat/message', { sessionId, message, urgent, api: selectedApi });
    return response.data;
  },
};

export const historyAPI = {
  getSessions: async () => {
    const response = await api.get('/history/sessions');
    return response.data;
  },

  getSession: async (sessionId) => {
    const response = await api.get(`/history/session/${sessionId}`);
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const response = await api.delete(`/history/session/${sessionId}`);
    return response.data;
  },
};

export const analyticsAPI = {
  getUsage: async (startDate, endDate) => {
    const response = await api.get('/analytics/usage', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

const API_BASE_URL = '/api';

export const fetchMessages = async (sessionId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/messages`, { params: { sessionId } });
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const pollMessages = (sessionId, callback, interval = 5000) => {
  const poll = async () => {
    const messages = await fetchMessages(sessionId);
    callback(messages);
  };

  const pollingInterval = setInterval(poll, interval);

  return () => clearInterval(pollingInterval); // Return a function to stop polling
};

export default api;
