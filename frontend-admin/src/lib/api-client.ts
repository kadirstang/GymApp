import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  ListResponse,
  Exercise,
  ExerciseFilters,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  WorkoutProgram,
  ProgramFilters,
  CreateWorkoutProgramRequest,
  UpdateWorkoutProgramRequest,
  ProgramExercise,
  AddExerciseToProgramRequest,
  UpdateProgramExerciseRequest,
  ReorderProgramExercisesRequest,
  WorkoutLog,
  WorkoutLogFilters,
  StartWorkoutRequest,
  EndWorkoutRequest,
  LogSetRequest,
  WorkoutStats,
  Equipment,
  EquipmentFilters,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  QRCodeResponse,
  EquipmentStats,
  ProductCategory,
  Product,
  ProductFilters,
  CreateProductCategoryRequest,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateStockRequest,
  Order,
  OrderFilters,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderStats,
  User,
  UserFilters,
  TrainerMatch,
  TrainerMatchFilters,
  CreateTrainerMatchRequest,
  UpdateTrainerMatchStatusRequest,
} from '@/types/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Handle 401 responses and format errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        // Extract error message from API response
        const apiMessage = error.response?.data?.message;
        if (apiMessage) {
          return Promise.reject(new Error(apiMessage));
        }

        return Promise.reject(error);
      }
    );
  }

  // ==================== AUTH ====================
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.client.post('/auth/refresh');
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // ==================== USERS ====================
  async getUsers(filters?: UserFilters): Promise<ApiResponse<ListResponse<User>>> {
    const response = await this.client.get('/users', { params: filters });
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  // ==================== TRAINER MATCHES ====================
  async getTrainerMatches(filters?: TrainerMatchFilters): Promise<ApiResponse<ListResponse<TrainerMatch>>> {
    const response = await this.client.get('/trainer-matches', { params: filters });
    return response.data;
  }

  async createTrainerMatch(data: CreateTrainerMatchRequest): Promise<ApiResponse<TrainerMatch>> {
    const response = await this.client.post('/trainer-matches', data);
    return response.data;
  }

  async updateTrainerMatchStatus(id: string, data: UpdateTrainerMatchStatusRequest): Promise<ApiResponse<TrainerMatch>> {
    const response = await this.client.patch(`/trainer-matches/${id}/status`, data);
    return response.data;
  }

  async deleteTrainerMatch(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/trainer-matches/${id}`);
    return response.data;
  }

  async getTrainerStudents(trainerId: string, status?: string): Promise<ApiResponse<{ trainerId: string; status?: string; totalStudents: number; students: User[] }>> {
    const response = await this.client.get(`/trainer-matches/trainer/${trainerId}/students`, {
      params: { status }
    });
    return response.data;
  }

  // ==================== EXERCISES ====================
  async getExercises(filters?: ExerciseFilters): Promise<ApiResponse<ListResponse<Exercise>>> {
    const response = await this.client.get('/exercises', { params: filters });
    return response.data;
  }

  async getExerciseById(id: string): Promise<ApiResponse<Exercise>> {
    const response = await this.client.get(`/exercises/${id}`);
    return response.data;
  }

  async createExercise(data: CreateExerciseRequest): Promise<ApiResponse<Exercise>> {
    const response = await this.client.post('/exercises', data);
    return response.data;
  }

  async updateExercise(id: string, data: UpdateExerciseRequest): Promise<ApiResponse<Exercise>> {
    const response = await this.client.put(`/exercises/${id}`, data);
    return response.data;
  }

  async deleteExercise(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/exercises/${id}`);
    return response.data;
  }

  async getExerciseStats(): Promise<ApiResponse<{ total: number; byDifficulty?: Record<string, number>; byMuscleGroup?: Record<string, number> }>> {
    const response = await this.client.get('/exercises/stats');
    return response.data;
  }

  // ==================== WORKOUT PROGRAMS ====================
  async getPrograms(filters?: ProgramFilters): Promise<ApiResponse<ListResponse<WorkoutProgram>>> {
    const response = await this.client.get('/programs', { params: filters });
    return response.data;
  }

  async getProgramById(id: string): Promise<ApiResponse<WorkoutProgram>> {
    const response = await this.client.get(`/programs/${id}`);
    return response.data;
  }

  // Alias for getProgramById
  async getProgram(id: string): Promise<ApiResponse<WorkoutProgram>> {
    return this.getProgramById(id);
  }

  async createProgram(data: CreateWorkoutProgramRequest): Promise<ApiResponse<WorkoutProgram>> {
    const response = await this.client.post('/programs', data);
    return response.data;
  }

  async updateProgram(id: string, data: UpdateWorkoutProgramRequest): Promise<ApiResponse<WorkoutProgram>> {
    const response = await this.client.put(`/programs/${id}`, data);
    return response.data;
  }

  async deleteProgram(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/programs/${id}`);
    return response.data;
  }

  async getProgramStats(): Promise<ApiResponse<{ total: number; byDifficulty?: Record<string, number>; assigned?: number; unassigned?: number }>> {
    const response = await this.client.get('/programs/stats');
    return response.data;
  }

  // ==================== PROGRAM EXERCISES ====================
  async getProgramExercises(programId: string): Promise<ApiResponse<ProgramExercise[]>> {
    const response = await this.client.get(`/programs/${programId}/exercises`);
    return response.data;
  }

  async addExerciseToProgram(programId: string, data: AddExerciseToProgramRequest): Promise<ApiResponse<ProgramExercise>> {
    const response = await this.client.post(`/programs/${programId}/exercises`, data);
    return response.data;
  }

  async updateProgramExercise(programId: string, exerciseId: string, data: UpdateProgramExerciseRequest): Promise<ApiResponse<ProgramExercise>> {
    const response = await this.client.put(`/programs/${programId}/exercises/${exerciseId}`, data);
    return response.data;
  }

  async deleteProgramExercise(programId: string, exerciseId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/programs/${programId}/exercises/${exerciseId}`);
    return response.data;
  }

  // Alias for deleteProgramExercise
  async removeExerciseFromProgram(programId: string, exerciseId: string): Promise<ApiResponse> {
    return this.deleteProgramExercise(programId, exerciseId);
  }

  async reorderProgramExercises(programId: string, data: ReorderProgramExercisesRequest): Promise<ApiResponse> {
    const response = await this.client.patch(`/programs/${programId}/exercises/reorder`, data);
    return response.data;
  }

  // ==================== WORKOUT LOGS ====================
  async getWorkoutLogs(filters?: WorkoutLogFilters): Promise<ApiResponse<ListResponse<WorkoutLog>>> {
    const response = await this.client.get('/workout-logs', { params: filters });
    return response.data;
  }

  async getWorkoutLogById(id: string): Promise<ApiResponse<WorkoutLog>> {
    const response = await this.client.get(`/workout-logs/${id}`);
    return response.data;
  }

  async startWorkout(data: StartWorkoutRequest): Promise<ApiResponse<WorkoutLog>> {
    const response = await this.client.post('/workout-logs/start', data);
    return response.data;
  }

  async endWorkout(id: string, data: EndWorkoutRequest): Promise<ApiResponse<WorkoutLog>> {
    const response = await this.client.post(`/workout-logs/${id}/end`, data);
    return response.data;
  }

  async logSet(id: string, data: LogSetRequest): Promise<ApiResponse> {
    const response = await this.client.post(`/workout-logs/${id}/sets`, data);
    return response.data;
  }

  async getWorkoutStats(): Promise<ApiResponse<WorkoutStats>> {
    const response = await this.client.get('/workout-logs/stats');
    return response.data;
  }

  // ==================== EQUIPMENT ====================
  async getEquipment(filters?: EquipmentFilters): Promise<ApiResponse<ListResponse<Equipment>>> {
    const response = await this.client.get('/equipment', { params: filters });
    return response.data;
  }

  async getEquipmentById(id: string): Promise<ApiResponse<Equipment>> {
    const response = await this.client.get(`/equipment/${id}`);
    return response.data;
  }

  async createEquipment(data: CreateEquipmentRequest): Promise<ApiResponse<Equipment>> {
    const response = await this.client.post('/equipment', data);
    return response.data;
  }

  async updateEquipment(id: string, data: UpdateEquipmentRequest): Promise<ApiResponse<Equipment>> {
    const response = await this.client.put(`/equipment/${id}`, data);
    return response.data;
  }

  async deleteEquipment(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/equipment/${id}`);
    return response.data;
  }

  async generateQRCode(id: string): Promise<ApiResponse<QRCodeResponse>> {
    const response = await this.client.get(`/equipment/${id}/qr-code`);
    return response.data;
  }

  async scanQRCode(uuid: string): Promise<ApiResponse<Equipment>> {
    const response = await this.client.get(`/equipment/scan/${uuid}`);
    return response.data;
  }

  async getEquipmentStats(): Promise<ApiResponse<EquipmentStats>> {
    const response = await this.client.get('/equipment/stats');
    return response.data;
  }

  // ==================== PRODUCTS ====================
  async getProductCategories(): Promise<ApiResponse<ProductCategory[]>> {
    const response = await this.client.get('/product-categories');
    return response.data;
  }

  async createProductCategory(data: CreateProductCategoryRequest): Promise<ApiResponse<ProductCategory>> {
    const response = await this.client.post('/product-categories', data);
    return response.data;
  }

  async getProducts(filters?: ProductFilters): Promise<ApiResponse<ListResponse<Product>>> {
    const response = await this.client.get('/products', { params: filters });
    return response.data;
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await this.client.get(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: CreateProductRequest): Promise<ApiResponse<Product>> {
    const response = await this.client.post('/products', data);
    return response.data;
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<ApiResponse<Product>> {
    const response = await this.client.put(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/products/${id}`);
    return response.data;
  }

  async updateProductStock(id: string, data: UpdateStockRequest): Promise<ApiResponse<Product>> {
    const response = await this.client.patch(`/products/${id}/stock`, data);
    return response.data;
  }

  // ==================== ORDERS ====================
  async getOrders(filters?: OrderFilters): Promise<ApiResponse<ListResponse<Order>>> {
    const response = await this.client.get('/orders', { params: filters });
    return response.data;
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const response = await this.client.get(`/orders/${id}`);
    return response.data;
  }

  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
    const response = await this.client.post('/orders', data);
    return response.data;
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusRequest): Promise<ApiResponse<Order>> {
    const response = await this.client.patch(`/orders/${id}/status`, data);
    return response.data;
  }

  async deleteOrder(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/orders/${id}`);
    return response.data;
  }

  async getOrderStats(): Promise<ApiResponse<OrderStats>> {
    const response = await this.client.get('/orders/stats');
    return response.data;
  }
}

export const apiClient = new ApiClient();
