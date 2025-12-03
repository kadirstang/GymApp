import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization token provided');
    }

    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError('Invalid token format');
    }

    // Verify and decode token
    const payload = verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      gymId: payload.gymId,
      roleId: payload.roleId,
      role: payload.role,
    };

    next();
  } catch (error) {
    // Pass JWT errors to global error handler
    next(error);
  }
};

/**
 * Optional authentication - doesn't throw error if no token
 * Useful for endpoints that change behavior based on auth status
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);

      if (token) {
        const payload = verifyToken(token);
        req.user = {
          userId: payload.userId,
          email: payload.email,
          gymId: payload.gymId,
          roleId: payload.roleId,
          role: payload.role,
        };
      }
    }

    next();
  } catch (error) {
    // Silently continue for optional auth
    next();
  }
};
