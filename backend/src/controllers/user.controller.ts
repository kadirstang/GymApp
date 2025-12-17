import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { successResponse } from '../utils/response';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

/**
 * Get all users with pagination and filtering
 * GET /api/users
 */
export const getUsers = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const gymId = req.user?.gymId;
    const { page = 1, limit = 10, role, search } = req.query;

    if (!gymId) {
      throw new ValidationError('Gym ID required');
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {
      gymId,
      deletedAt: null,
    };

    if (role) {
      where.role = { name: role as string };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Execute query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          birthDate: true,
          gender: true,
          roleId: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          trainerMatchesAsStudent: {
            where: {
              status: 'active',
              deletedAt: null,
            },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Add hasPrivateTraining flag to each user
    const usersWithBadge = users.map(user => ({
      ...user,
      hasPrivateTraining: user.trainerMatchesAsStudent.length > 0,
      trainerMatchesAsStudent: undefined, // Remove from response
    }));

    return successResponse(_res, {
      items: usersWithBadge,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const gymId = req.user?.gymId;

    const user = await prisma.user.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        birthDate: true,
        gender: true,
        gymId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        gym: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    successResponse(_res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
export const updateUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const gymId = req.user?.gymId;
    const userId = req.user?.userId;
    const { firstName, lastName, phone, avatarUrl, birthDate, gender, roleId } = req.body;

    // Check if user exists and belongs to same gym
    const existingUser = await prisma.user.findFirst({
      where: { id, gymId, deletedAt: null },
      include: { role: true },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Users can only update their own profile unless they have permission
    if (id !== userId) {
      // Check if current user has permission to update other users
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      const permissions = currentUser?.role?.permissions as any;
      if (!permissions?.users?.update) {
        throw new ForbiddenError('You can only update your own profile');
      }
    }

    // If roleId is being changed, verify it exists and belongs to same gym
    if (roleId && roleId !== existingUser.roleId) {
      const role = await prisma.role.findFirst({
        where: { id: roleId, gymId },
      });

      if (!role) {
        throw new ValidationError('Invalid role');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        phone: phone !== undefined ? phone : existingUser.phone,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : existingUser.avatarUrl,
        birthDate: birthDate !== undefined ? new Date(birthDate) : existingUser.birthDate,
        gender: gender !== undefined ? gender : existingUser.gender,
        roleId: roleId || existingUser.roleId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        birthDate: true,
        gender: true,
        roleId: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    successResponse(_res, updatedUser, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 * PUT /api/users/:id/password
 */
export const changePassword = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters');
    }

    // Users can only change their own password
    if (id !== userId) {
      throw new ForbiddenError('You can only change your own password');
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
    });

    successResponse(_res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user custom permissions
 * Only GymOwner can assign custom permissions to trainers
 */
export const updateCustomPermissions = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { customPermissions } = req.body;
    const gymId = req.user?.gymId;

    // Validation
    if (!customPermissions || typeof customPermissions !== 'object') {
      throw new ValidationError('Custom permissions must be an object');
    }

    // Get target user
    const targetUser = await prisma.user.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Only allow setting custom permissions for Trainers
    if (targetUser.role.name !== 'Trainer') {
      throw new ValidationError('Custom permissions can only be set for Trainers');
    }

    // Update custom permissions
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { customPermissions },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        customPermissions: true,
        role: {
          select: {
            name: true,
            permissions: true,
          },
        },
      },
    });

    successResponse(_res, updatedUser, 'Custom permissions updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete)
 * DELETE /api/users/:id
 */
export const deleteUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const gymId = req.user?.gymId;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { id, gymId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    successResponse(_res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user measurements
 * GET /api/users/:id/measurements
 */
export const getUserMeasurements = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const gymId = req.user?.gymId;
    const { limit = 10 } = req.query;

    // Verify user exists and belongs to same gym
    const user = await prisma.user.findFirst({
      where: { id, gymId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const measurements = await prisma.userMeasurement.findMany({
      where: { userId: id },
      orderBy: { measuredAt: 'desc' },
      take: parseInt(limit as string, 10),
    });

    successResponse(_res, measurements, 'Measurements retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add user measurement
 * POST /api/users/:id/measurements
 */
export const addUserMeasurement = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const gymId = req.user?.gymId;
    const { weight, height, bodyFatPercentage, muscleMass } = req.body;

    // Verify user exists and belongs to same gym
    const user = await prisma.user.findFirst({
      where: { id, gymId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Create measurement
    const measurement = await prisma.userMeasurement.create({
      data: {
        userId: id,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : null,
        muscleMass: muscleMass ? parseFloat(muscleMass) : null,
      },
    });

    successResponse(_res, measurement, 'Measurement added successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user measurement
 * PUT /api/users/:userId/measurements/:measurementId
 */
export const updateUserMeasurement = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, measurementId } = req.params;
    const gymId = req.user?.gymId;
    const { weight, height, bodyFatPercentage, muscleMass } = req.body;

    // Verify user exists and belongs to same gym
    const user = await prisma.user.findFirst({
      where: { id: userId, gymId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify measurement exists and belongs to user
    const existingMeasurement = await prisma.userMeasurement.findFirst({
      where: { id: measurementId, userId },
    });

    if (!existingMeasurement) {
      throw new NotFoundError('Measurement not found');
    }

    // Update measurement
    const measurement = await prisma.userMeasurement.update({
      where: { id: measurementId },
      data: {
        weight: weight !== undefined ? parseFloat(weight) : existingMeasurement.weight,
        height: height !== undefined ? parseFloat(height) : existingMeasurement.height,
        bodyFatPercentage: bodyFatPercentage !== undefined ? parseFloat(bodyFatPercentage) : existingMeasurement.bodyFatPercentage,
        muscleMass: muscleMass !== undefined ? parseFloat(muscleMass) : existingMeasurement.muscleMass,
      },
    });

    successResponse(_res, measurement, 'Measurement updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user measurement
 * DELETE /api/users/:userId/measurements/:measurementId
 */
export const deleteUserMeasurement = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, measurementId } = req.params;
    const gymId = req.user?.gymId;

    // Verify user exists and belongs to same gym
    const user = await prisma.user.findFirst({
      where: { id: userId, gymId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify measurement exists and belongs to user
    const measurement = await prisma.userMeasurement.findFirst({
      where: { id: measurementId, userId },
    });

    if (!measurement) {
      throw new NotFoundError('Measurement not found');
    }

    // Delete measurement
    await prisma.userMeasurement.delete({
      where: { id: measurementId },
    });

    successResponse(_res, null, 'Measurement deleted successfully');
  } catch (error) {
    next(error);
  }
};
