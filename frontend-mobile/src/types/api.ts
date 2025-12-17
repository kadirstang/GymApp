// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  gender?: string;
  gymId: string;
  roleId: string;
  role: {
    id: string;
    name: string;
  };
  gym: {
    id: string;
    name: string;
    slug: string;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Program types
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  targetMuscleGroup: string;
  videoUrl?: string;
}

export interface ProgramExercise {
  id: string;
  orderIndex: number;
  sets: number;
  reps: string;
  repsMin?: number;
  repsMax?: number;
  restTimeSeconds?: number;
  restSeconds?: number;
  notes?: string;
  exercise: Exercise;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  difficultyLevel: string;
  isPublic: boolean;
  assignedUserId?: string;
  programExercises: ProgramExercise[];
}

// Workout types
export interface WorkoutEntry {
  exerciseId: string;
  sets: Array<{
    reps: number;
    weight?: number;
    completed: boolean;
  }>;
}

export interface WorkoutLog {
  id?: string;
  programId: string;
  userId?: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  entries: WorkoutEntry[];
}

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: 'pending_approval' | 'prepared' | 'completed' | 'cancelled';
  metadata?: {
    deliveryNotes?: string;
    cancellationReason?: string;
  };
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product: Product;
  }>;
}

// Measurement types
export interface UserMeasurement {
  id: string;
  weight?: number;
  height?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  measuredAt: string;
}
