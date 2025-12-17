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
  avatarUrl?: string;
  hasPrivateTraining?: boolean;
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
  equipmentNeededId?: string;
  equipment?: {
    id: string;
    name: string;
    status: string;
  };
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
  equipmentNeededId?: string;
}

export type UpdateExerciseRequest = Partial<CreateExerciseRequest>;

// ==================== WORKOUT PROGRAM ====================
export interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks?: number;
  createdBy: string;
  assignedUserId?: string;
  isPublic: boolean;
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
  isPublic?: boolean;
}

export type UpdateWorkoutProgramRequest = Partial<CreateWorkoutProgramRequest>;

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
  startedAt: string;
  completedAt?: string;
  duration?: number;
  status?: 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  user?: User;
  program?: WorkoutProgram;
  entries?: WorkoutLogEntry[];
  _count?: {
    entries: number;
  };
  createdAt?: string;
  updatedAt?: string;
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

export type UpdateEquipmentRequest = Partial<CreateEquipmentRequest>;

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
  imageUrl?: string;
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

export type UpdateProductRequest = Partial<CreateProductRequest>;

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
  metadata?: {
    cancellationReason?: string;
    internalNotes?: string;
    deliveryNotes?: string;
    paymentMethod?: string;
  };
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
  metadata?: {
    cancellationReason?: string;
    internalNotes?: string;
    deliveryNotes?: string;
    paymentMethod?: string;
  };
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
export interface ApiResponse<T = unknown> {
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
