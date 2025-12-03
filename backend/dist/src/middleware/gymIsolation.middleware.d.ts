import { Request, Response, NextFunction } from 'express';
export declare const enforceGymIsolation: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const verifyResourceGymOwnership: (model: string, resourceIdParam?: string) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const verifySameGymUser: (userIdParam?: string) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const allowSuperAdminBypass: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=gymIsolation.middleware.d.ts.map