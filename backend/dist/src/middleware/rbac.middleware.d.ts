import { Request, Response, NextFunction } from 'express';
export declare const requirePermission: (requiredPermission: string) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireAnyPermission: (requiredPermissions: string[]) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireAllPermissions: (requiredPermissions: string[]) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (allowedRoles: string[]) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rbac.middleware.d.ts.map