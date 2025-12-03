import { JWTPayload } from '../types';
export declare const generateToken: (payload: JWTPayload) => string;
export declare const generateRefreshToken: (payload: JWTPayload) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const decodeToken: (token: string) => JWTPayload | null;
export declare const extractTokenFromHeader: (authHeader?: string) => string | null;
//# sourceMappingURL=jwt.d.ts.map