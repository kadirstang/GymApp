import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse } from '../utils/response';
import { ValidationError, NotFoundError } from '../utils/errors';
import { deleteAvatar } from '../middleware/upload.middleware';

const prisma = new PrismaClient();

/**
 * Upload user avatar
 * POST /api/users/:id/avatar
 */
export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const gymId = req.user?.gymId;
    const userId = req.user?.userId;

    // Check if file was uploaded
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    // Verify user exists and belongs to same gym
    const user = await prisma.user.findFirst({
      where: { id, gymId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Users can only upload their own avatar unless they have permission
    if (id !== userId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      const permissions = currentUser?.role?.permissions as any;
      if (!permissions?.users?.update) {
        throw new ValidationError('You can only update your own avatar');
      }
    }

    // Delete old avatar if exists
    if (user.avatarUrl) {
      deleteAvatar(user.avatarUrl);
    }

    // Generate avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user with new avatar URL
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    successResponse(res, updatedUser, 'Avatar uploaded successfully');
  } catch (error) {
    // If error occurs, delete the uploaded file
    if (req.file) {
      deleteAvatar(`/uploads/avatars/${req.file.filename}`);
    }
    next(error);
  }
};

/**
 * Delete user avatar
 * DELETE /api/users/:id/avatar
 */
export const deleteUserAvatar = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const gymId = req.user?.gymId;
    const userId = req.user?.userId;

    // Verify user exists and belongs to same gym
    const user = await prisma.user.findFirst({
      where: { id, gymId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Users can only delete their own avatar unless they have permission
    if (id !== userId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      const permissions = currentUser?.role?.permissions as any;
      if (!permissions?.users?.update) {
        throw new ValidationError('You can only delete your own avatar');
      }
    }

    if (!user.avatarUrl) {
      throw new ValidationError('User has no avatar to delete');
    }

    // Delete avatar file
    deleteAvatar(user.avatarUrl);

    // Update user to remove avatar URL
    await prisma.user.update({
      where: { id },
      data: { avatarUrl: null },
    });

    successResponse(_res, null, 'Avatar deleted successfully');
  } catch (error) {
    next(error);
  }
};
