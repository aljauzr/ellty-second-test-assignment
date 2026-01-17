import axios from 'axios';
import { AuthResponse, CalculationNode, OperationType } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { username, password });
    return response.data;
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { username, password });
    return response.data;
  },

  getMe: async (): Promise<{ id: string; username: string }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Calculations API
export const calculationsApi = {
  getAll: async (): Promise<CalculationNode[]> => {
    const response = await api.get<CalculationNode[]>('/calculations');
    return response.data;
  },

  createStartingNumber: async (number: number): Promise<CalculationNode> => {
    const response = await api.post<CalculationNode>('/calculations/start', { number });
    return response.data;
  },

  addOperation: async (
    parentId: string,
    operation: OperationType,
    operand: number
  ): Promise<CalculationNode> => {
    const response = await api.post<CalculationNode>('/calculations/operate', {
      parentId,
      operation,
      operand,
    });
    return response.data;
  },
};

export default api;
