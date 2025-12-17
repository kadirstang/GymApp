export interface JWTPayload {
    userId: string;
    email: string;
    gymId: string;
    roleId: string;
    role: string;
}
export interface AuthRequest extends Request {
    user?: JWTPayload;
}
export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}
export interface PaginatedResponse<T = any> extends ApiResponse<T> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface UserCreateInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    gymId: string;
    roleId: string;
}
export interface UserUpdateInput {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
}
export interface WorkoutLogInput {
    userId: string;
    programId: string;
    startedAt: Date;
    endedAt?: Date;
    notes?: string;
}
export interface WorkoutLogEntryInput {
    workoutLogId: string;
    exerciseId: string;
    setNumber: number;
    weightKg?: number;
    repsCompleted: number;
    rpe?: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
            gymId?: string;
            isSuperAdmin?: boolean;
        }
    }
}
export {};
//# sourceMappingURL=index.d.ts.map