import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ForbiddenError, UnauthorizedError, NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

/**
 * Ensure user can only access data from their own gym
 * This middleware should be used after authenticate middleware
 */
export const enforceGymIsolation = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userGymId = req.user?.gymId;

    if (!userGymId) {
      throw new UnauthorizedError('User gym information not found');
    }

    // Automatically inject gymId filter for all requests
    // This ensures users can only see data from their gym
    req.gymId = userGymId;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify resource belongs to user's gym
 * @param model - Prisma model name (e.g., 'user', 'workoutProgram', 'product')
 * @param resourceIdParam - Request parameter name containing the resource ID (default: 'id')
 */
export const verifyResourceGymOwnership = (model: string, resourceIdParam: string = 'id') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGymId = req.user?.gymId;
      const resourceId = req.params[resourceIdParam];

      if (!userGymId) {
        throw new UnauthorizedError('User gym information not found');
      }

      if (!resourceId) {
        throw new NotFoundError(`Resource ID parameter '${resourceIdParam}' not found`);
      }

      // Access the specific Prisma model dynamically
      const prismaModel = (prisma as any)[model];

      if (!prismaModel) {
        throw new Error(`Invalid model: ${model}`);
      }

      // Find resource and check gym ownership
      const resource = await prismaModel.findUnique({
        where: { id: resourceId },
        select: { gymId: true },
      });

      if (!resource) {
        throw new NotFoundError(`${model} not found`);
      }

      if (resource.gymId !== userGymId) {
        throw new ForbiddenError('You cannot access resources from another gym');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Verify user belongs to the same gym as another user
 * Useful for trainer-student, owner-trainer relationships
 * @param userIdParam - Request parameter name containing the target user ID (default: 'userId')
 */
export const verifySameGymUser = (userIdParam: string = 'userId') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserGymId = req.user?.gymId;
      const targetUserId = req.params[userIdParam];

      if (!currentUserGymId) {
        throw new UnauthorizedError('User gym information not found');
      }

      if (!targetUserId) {
        throw new NotFoundError(`User ID parameter '${userIdParam}' not found`);
      }

      // Find target user
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { gymId: true },
      });

      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      if (targetUser.gymId !== currentUserGymId) {
        throw new ForbiddenError('You cannot access users from another gym');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Allow SuperAdmin to bypass gym isolation
 * This should be used sparingly and only for admin-level operations
 */
export const allowSuperAdminBypass = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roleId = req.user?.roleId;

    if (!roleId) {
      throw new UnauthorizedError('Not authenticated');
    }

    // Check if user is SuperAdmin
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { name: true },
    });

    if (role?.name === 'SuperAdmin') {
      // SuperAdmin can bypass gym isolation
      req.isSuperAdmin = true;
    }

    next();
  } catch (error) {
    next(error);
  }
};
