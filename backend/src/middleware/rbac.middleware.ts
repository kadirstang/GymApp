import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

const prisma = new PrismaClient();

/**
 * Check if user has required permission
 * @param requiredPermission - Permission key to check (e.g., 'users.create', 'workouts.read')
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const roleId = req.user?.roleId;

      if (!userId || !roleId) {
        throw new UnauthorizedError('Not authenticated');
      }

      // Fetch role with permissions
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: {
          name: true,
          permissions: true,
        },
      });

      if (!role) {
        throw new ForbiddenError('Role not found');
      }

      // Check if role has the required permission
      const permissions = role.permissions as Record<string, any>;

      // Parse permission key (e.g., 'users.create' -> resource: 'users', action: 'create')
      const [resource, action] = requiredPermission.split('.');

      if (!resource || !action) {
        throw new Error('Invalid permission format. Use "resource.action"');
      }

      // Check permission in JSONB structure
      const hasPermission =
        permissions &&
        permissions[resource] &&
        permissions[resource][action] === true;

      if (!hasPermission) {
        throw new ForbiddenError(`You don't have permission to ${action} ${resource}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has any of the required permissions
 * @param requiredPermissions - Array of permission keys
 */
export const requireAnyPermission = (requiredPermissions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const roleId = req.user?.roleId;

      if (!userId || !roleId) {
        throw new UnauthorizedError('Not authenticated');
      }

      // Fetch role with permissions
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: {
          name: true,
          permissions: true,
        },
      });

      if (!role) {
        throw new ForbiddenError('Role not found');
      }

      const permissions = role.permissions as Record<string, any>;

      // Check if user has any of the required permissions
      const hasAnyPermission = requiredPermissions.some(permission => {
        const [resource, action] = permission.split('.');
        return permissions?.[resource]?.[action] === true;
      });

      if (!hasAnyPermission) {
        throw new ForbiddenError('You don\'t have the required permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has all of the required permissions
 * @param requiredPermissions - Array of permission keys
 */
export const requireAllPermissions = (requiredPermissions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const roleId = req.user?.roleId;

      if (!userId || !roleId) {
        throw new UnauthorizedError('Not authenticated');
      }

      // Fetch role with permissions
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: {
          name: true,
          permissions: true,
        },
      });

      if (!role) {
        throw new ForbiddenError('Role not found');
      }

      const permissions = role.permissions as Record<string, any>;

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission => {
        const [resource, action] = permission.split('.');
        return permissions?.[resource]?.[action] === true;
      });

      if (!hasAllPermissions) {
        throw new ForbiddenError('You don\'t have all the required permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has a specific role name
 * @param allowedRoles - Array of role names (e.g., ['GymOwner', 'Trainer'])
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const roleId = req.user?.roleId;

      if (!userId || !roleId) {
        throw new UnauthorizedError('Not authenticated');
      }

      // Fetch role
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: {
          name: true,
        },
      });

      if (!role) {
        throw new ForbiddenError('Role not found');
      }

      if (!allowedRoles.includes(role.name)) {
        throw new ForbiddenError(`This action requires one of these roles: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
