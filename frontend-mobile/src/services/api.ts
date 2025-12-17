import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API base URL - Docker backend on host machine
// For physical device testing: Use your computer's local network IP
// Find it with: ip -4 addr show | grep inet | grep -v 127.0.0.1
const API_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://192.168.1.97:3001/api'    // Physical device or Android emulator
    : 'http://192.168.1.97:3001/api'    // Physical device or iOS simulator
  : 'https://your-production-api.com/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  // Public method to get axios client for direct access
  getClient() {
    return this.client;
  }

  private setupInterceptors() {
    // Request interceptor - add JWT token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.multiRemove(['token', 'user']);
          // Emit logout event (will be handled by AuthContext)
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  // Program endpoints
  async getAssignedProgram(userId: string) {
    const response = await this.client.get(`/programs?assignedUserId=${userId}`);
    return response.data;
  }

  async getProgramById(programId: string) {
    const response = await this.client.get(`/programs/${programId}`);
    return response.data;
  }

  // Workout endpoints
  async createWorkoutLog(data: any) {
    const response = await this.client.post('/workout-logs/start', data);
    return response.data;
  }

  async endWorkoutLog(workoutLogId: string, data: any) {
    const response = await this.client.put(`/workout-logs/${workoutLogId}/end`, data);
    return response.data;
  }

  async getWorkoutLogs(userId: string, page = 1, limit = 20) {
    const response = await this.client.get(`/workout-logs?userId=${userId}&page=${page}&limit=${limit}`);
    return response.data;
  }

  async getWorkoutLogById(logId: string) {
    const response = await this.client.get(`/workout-logs/${logId}`);
    return response.data;
  }

  // Product endpoints
  async getProducts(page = 1, limit = 20, categoryId?: string) {
    let url = `/products?page=${page}&limit=${limit}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    const response = await this.client.get(url);
    return response.data;
  }

  async getProductCategories() {
    const response = await this.client.get('/product-categories');
    return response.data;
  }

  // Order endpoints
  async createOrder(items: Array<{ productId: string; quantity: number }>, metadata?: any) {
    const response = await this.client.post('/orders', { items, metadata });
    return response.data;
  }

  async getMyOrders(userId: string, page = 1) {
    const response = await this.client.get(`/orders?userId=${userId}&page=${page}&limit=20`);
    return response.data;
  }

  // User endpoints
  async getUserById(userId: string) {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, data: any) {
    const response = await this.client.patch(`/users/${userId}`, data);
    return response.data;
  }

  // Measurement endpoints
  async createMeasurement(userId: string, data: any) {
    const response = await this.client.post(`/users/${userId}/measurements`, data);
    return response.data;
  }

  async getUserMeasurements(userId: string) {
    const response = await this.client.get(`/users/${userId}/measurements`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
