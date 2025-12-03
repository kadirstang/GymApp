export class AppError extends Error {
    constructor(message: any, statusCode: any);
    statusCode: any;
    status: string;
    isOperational: boolean;
}
export class ValidationError extends AppError {
    constructor(message: any);
}
export class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export class ForbiddenError extends AppError {
    constructor(message?: string);
}
export class NotFoundError extends AppError {
    constructor(message?: string);
}
export class ConflictError extends AppError {
    constructor(message: any);
}
//# sourceMappingURL=errors.d.ts.map