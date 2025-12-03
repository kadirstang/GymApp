# Frontend TypeScript Type Definitions

Copy these type definitions to your Next.js frontend project.

```typescript
// types/api.ts

// ==================== AUTH ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'Student' | 'Trainer' | 'GymOwner';
  gymId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ==================== USER ====================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  gym?: Gym;
  gymId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: 'Student' | 'Trainer' | 'GymOwner' | 'SuperAdmin';
  permissions: Record<string, Record<string, boolean>>;
}

export interface Gym {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// ==================== TRAINER MATCH ====================
export interface TrainerMatch {
  id: string;
  trainerId: string;
  studentId: string;
  status: 'pending' | 'active' | 'ended';
  startedAt?: string;
  endedAt?: string;
  trainer?: User;
  student?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainerMatchRequest {
  trainerId: string;
  studentId: string;
}

export interface UpdateTrainerMatchStatusRequest {
  status: 'pending' | 'active' | 'ended';
}

// ==================== EXERCISE ====================
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  targetMuscleGroup: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment?: string;
  createdBy: string;
  gymId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateExerciseRequest {
  name: string;
  description?: string;
  videoUrl?: string;
  targetMuscleGroup: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment?: string;
}

export interface UpdateExerciseRequest extends Partial<CreateExerciseRequest> {}

// ==================== WORKOUT PROGRAM ====================
export interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks?: number;
  createdBy: string;
  assignedUserId?: string;
  gymId: string;
  programExercises?: ProgramExercise[];
  assignedUser?: User;
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateWorkoutProgramRequest {
  name: string;
  description?: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks?: number;
  assignedUserId?: string;
}

export interface UpdateWorkoutProgramRequest extends Partial<CreateWorkoutProgramRequest> {}

// ==================== PROGRAM EXERCISE ====================
export interface ProgramExercise {
  id: string;
  programId: string;
  exerciseId: string;
  orderIndex: number;
  sets: number;
  reps: string;
  restTimeSeconds: number;
  notes?: string;
  exercise?: Exercise;
  createdAt: string;
  updatedAt: string;
}

export interface AddExerciseToProgramRequest {
  exerciseId: string;
  orderIndex: number;
  sets: number;
  reps: string;
  restTimeSeconds: number;
  notes?: string;
}

export interface UpdateProgramExerciseRequest {
  sets?: number;
  reps?: string;
  restTimeSeconds?: number;
  notes?: string;
}

export interface ReorderProgramExercisesRequest {
  exerciseIds: string[];
}

// ==================== WORKOUT LOG ====================
export interface WorkoutLog {
  id: string;
  userId: string;
  programId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  user?: User;
  program?: WorkoutProgram;
  entries?: WorkoutLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutLogEntry {
  id: string;
  workoutLogId: string;
  exerciseId: string;
  setNumber: number;
  weightKg?: number;
  repsCompleted: number;
  rpe?: number;
  notes?: string;
  exercise?: Exercise;
  createdAt: string;
}

export interface StartWorkoutRequest {
  programId: string;
  notes?: string;
}

export interface EndWorkoutRequest {
  notes?: string;
}

export interface LogSetRequest {
  exerciseId: string;
  setNumber: number;
  weightKg?: number;
  repsCompleted: number;
  rpe?: number;
  notes?: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;
  averageDuration: number;
  thisWeek: number;
  thisMonth: number;
  totalSets: number;
  totalReps: number;
}

// ==================== EQUIPMENT ====================
export interface Equipment {
  id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  status: 'active' | 'maintenance' | 'broken';
  qrCodeUuid: string;
  gymId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateEquipmentRequest {
  name: string;
  description?: string;
  videoUrl?: string;
  status?: 'active' | 'maintenance' | 'broken';
}

export interface UpdateEquipmentRequest extends Partial<CreateEquipmentRequest> {}

export interface QRCodeResponse {
  qrCodeImage: string; // Base64 encoded image
  qrCodeUuid: string;
}

export interface EquipmentStats {
  total: number;
  byStatus: {
    active: number;
    maintenance: number;
    broken: number;
  };
}

// ==================== PRODUCT ====================
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  gymId: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: string; // Decimal as string
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  gymId: string;
  category?: ProductCategory;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateProductCategoryRequest {
  name: string;
  description?: string;
}

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface UpdateStockRequest {
  stockQuantity: number;
}

// ==================== ORDER ====================
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'pending_approval' | 'prepared' | 'completed' | 'cancelled';
  totalAmount: string; // Decimal as string
  notes?: string;
  user?: User;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string; // Decimal as string
  subtotal: string; // Decimal as string
  product?: Product;
}

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'pending_approval' | 'prepared' | 'completed' | 'cancelled';
}

export interface OrderStats {
  total: number;
  byStatus: {
    pending_approval: number;
    prepared: number;
    completed: number;
    cancelled: number;
  };
  totalRevenue: string;
  avgOrderValue: string;
}

// ==================== PAGINATION ====================
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListResponse<T> {
  items: T[];
  pagination: PaginationResponse;
}

// ==================== API RESPONSE ====================
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    statusCode: number;
    status: string;
    isOperational: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
  error?: {
    statusCode: number;
    status: string;
  };
}

// ==================== FILTER PARAMS ====================
export interface ExerciseFilters extends PaginationParams {
  search?: string;
  targetMuscleGroup?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment?: string;
}

export interface ProgramFilters extends PaginationParams {
  search?: string;
  difficultyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  assignedUserId?: string;
}

export interface WorkoutLogFilters extends PaginationParams {
  userId?: string;
  programId?: string;
  status?: 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
}

export interface EquipmentFilters extends PaginationParams {
  search?: string;
  status?: 'active' | 'maintenance' | 'broken';
}

export interface ProductFilters extends PaginationParams {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface OrderFilters extends PaginationParams {
  status?: 'pending_approval' | 'prepared' | 'completed' | 'cancelled';
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserFilters extends PaginationParams {
  role?: 'Student' | 'Trainer' | 'GymOwner';
  search?: string;
  gymId?: string;
}

export interface TrainerMatchFilters extends PaginationParams {
  status?: 'pending' | 'active' | 'ended';
  trainerId?: string;
  studentId?: string;
}

// ==================== HELPER TYPES ====================
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type UserRole = 'Student' | 'Trainer' | 'GymOwner' | 'SuperAdmin';
export type EquipmentStatus = 'active' | 'maintenance' | 'broken';
export type OrderStatus = 'pending_approval' | 'prepared' | 'completed' | 'cancelled';
export type WorkoutStatus = 'in_progress' | 'completed' | 'cancelled';
export type MatchStatus = 'pending' | 'active' | 'ended';
```

## Usage Examples

### API Client Setup
```typescript
// lib/api-client.ts
import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  // Exercises
  async getExercises(filters?: ExerciseFilters): Promise<ApiResponse<ListResponse<Exercise>>> {
    const response = await this.client.get('/exercises', { params: filters });
    return response.data;
  }

  async createExercise(data: CreateExerciseRequest): Promise<ApiResponse<Exercise>> {
    const response = await this.client.post('/exercises', data);
    return response.data;
  }

  // Programs
  async getPrograms(filters?: ProgramFilters): Promise<ApiResponse<ListResponse<WorkoutProgram>>> {
    const response = await this.client.get('/programs', { params: filters });
    return response.data;
  }

  async getProgramById(id: string): Promise<ApiResponse<WorkoutProgram>> {
    const response = await this.client.get(`/programs/${id}`);
    return response.data;
  }

  // Orders
  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
    const response = await this.client.post('/orders', data);
    return response.data;
  }

  async getOrders(filters?: OrderFilters): Promise<ApiResponse<ListResponse<Order>>> {
    const response = await this.client.get('/orders', { params: filters });
    return response.data;
  }

  // Add more methods as needed...
}

export const apiClient = new ApiClient();
```

### React Hook Example
```typescript
// hooks/useExercises.ts
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Exercise, ExerciseFilters } from '@/types/api';

export function useExercises(filters?: ExerciseFilters) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExercises() {
      try {
        setLoading(true);
        const response = await apiClient.getExercises(filters);
        setExercises(response.data?.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
      } finally {
        setLoading(false);
      }
    }

    fetchExercises();
  }, [filters]);

  return { exercises, loading, error };
}
```

**Last Updated:** December 2, 2025
